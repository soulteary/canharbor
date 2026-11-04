// SPDX-License-Identifier: AGPL-3.0-or-later
use crate::{
    Error,
    control::{self, Capabilities, DeviceConfig, Request, Timing},
    wire::{self, Layout, Packet},
};
use canharbor_core::Frame;
use std::collections::BTreeMap;

/// An implementation must enforce USB timeouts and provide complete firmware
/// records. One Device owns the transport for all channels. No automatic retry.
pub trait Transport {
    fn control_in(&mut self, request: Request, length: usize) -> Result<Vec<u8>, Error>;
    fn control_out(&mut self, request: Request, data: &[u8]) -> Result<(), Error>;
    fn write(&mut self, data: &[u8]) -> Result<(), Error>;
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum State {
    Stopped,
    Running,
    Faulted,
}
struct Channel {
    capabilities: Capabilities,
    state: State,
    layout: Layout,
    listen_only: bool,
}
/// Echo means firmware echo only, not bus acknowledgement or ECU delivery.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Event {
    Received(Packet),
    Echo(Packet),
    UnmatchedEcho(Packet),
}
/// Single-owner protocol engine. Not registered with the M0 runtime: that
/// adapter must first gain real configure/start/stop and diagnostic semantics.
pub struct Device<T> {
    transport: T,
    interface: u16,
    config: DeviceConfig,
    channels: Vec<Channel>,
    pending: BTreeMap<u32, (u8, Frame)>,
    next_echo: u32,
}
impl<T: Transport> Device<T> {
    pub fn open(mut transport: T, interface: u16) -> Result<Self, Error> {
        let req = |request, value, input| Request {
            request,
            value,
            index: interface,
            input,
        };
        transport.control_out(req(0, 1, false), &0xbeef_u32.to_le_bytes())?;
        let config = DeviceConfig::parse(&transport.control_in(req(5, 1, true), 12)?)?;
        let mut channels = Vec::new();
        for ch in 0..config.channels {
            let legacy = transport.control_in(req(4, ch, true), 40)?;
            if legacy.len() != 40 {
                return Err(Error::Protocol("legacy capabilities length"));
            }
            let mut capabilities = Capabilities::parse(&legacy)?;
            if capabilities.features & control::BT_CONST_EXT != 0 {
                let extended = transport.control_in(req(11, ch, true), 72)?;
                if extended.len() != 72 {
                    return Err(Error::Protocol("extended capabilities length"));
                }
                capabilities = Capabilities::parse(&extended)?;
            }
            // Reset each channel explicitly before exposing stopped state.
            transport.control_out(req(2, ch, false), &control::mode(false, 0))?;
            channels.push(Channel {
                capabilities,
                state: State::Stopped,
                layout: Layout::default(),
                listen_only: true,
            });
        }
        Ok(Self {
            transport,
            interface,
            config,
            channels,
            pending: BTreeMap::new(),
            next_echo: 0,
        })
    }
    fn channel(&self, ch: u8) -> Result<&Channel, Error> {
        self.channels
            .get(usize::from(ch))
            .ok_or(Error::Protocol("channel"))
    }
    pub fn config(&self) -> DeviceConfig {
        self.config
    }
    pub fn state(&self, ch: u8) -> Result<State, Error> {
        Ok(self.channel(ch)?.state)
    }
    pub fn capabilities(&self, ch: u8) -> Result<&Capabilities, Error> {
        Ok(&self.channel(ch)?.capabilities)
    }
    fn output(&mut self, ch: u8, request: u8, data: &[u8]) -> Result<(), Error> {
        if self
            .transport
            .control_out(
                Request {
                    input: false,
                    request,
                    value: u16::from(ch),
                    index: self.interface,
                },
                data,
            )
            .is_err()
        {
            self.fail();
            return Err(Error::Transport);
        }
        Ok(())
    }
    fn fail(&mut self) {
        for channel in &mut self.channels {
            channel.state = State::Faulted;
        }
        // Retain pending IDs: no failed/confirmed claim can be made after I/O failure.
    }
    pub fn pending(&self) -> usize {
        self.pending.len()
    }
    pub fn start(
        &mut self,
        ch: u8,
        nominal: Timing,
        data: Option<Timing>,
        listen_only: bool,
        timestamps: bool,
    ) -> Result<(), Error> {
        let c = self.channel(ch)?;
        if c.state != State::Stopped {
            return Err(Error::State);
        }
        nominal.validate(c.capabilities.nominal)?;
        let mut flags = 0;
        for (enable, feature, name) in [
            (listen_only, control::LISTEN_ONLY, "listen-only"),
            (timestamps, control::HW_TIMESTAMP, "timestamps"),
            (data.is_some(), control::FD, "CAN FD"),
        ] {
            if enable {
                if c.capabilities.features & feature == 0 {
                    return Err(Error::Unsupported(name));
                }
                flags |= feature;
            }
        }
        if let Some(timing) = data {
            timing.validate(
                c.capabilities
                    .data
                    .ok_or(Error::Unsupported("FD timing limits"))?,
            )?;
        }
        self.output(ch, 1, &nominal.bytes())?;
        if let Some(timing) = data {
            self.output(ch, 10, &timing.bytes())?;
        }
        self.output(ch, 2, &control::mode(true, flags))?;
        let c = &mut self.channels[usize::from(ch)];
        c.state = State::Running;
        c.listen_only = listen_only;
        c.layout = Layout {
            fd: data.is_some(),
            timestamps,
            classic_len8_dlc: false,
        };
        Ok(())
    }
    pub fn stop(&mut self, ch: u8) -> Result<(), Error> {
        if self.channel(ch)?.state == State::Faulted {
            return Err(Error::State);
        }
        self.output(ch, 2, &control::mode(false, 0))?;
        self.channels[usize::from(ch)].state = State::Stopped;
        // Outstanding echoes remain outcome-unknown and occupy their slots.
        Ok(())
    }
    pub fn transmit(&mut self, ch: u8, frame: Frame) -> Result<u32, Error> {
        let c = self.channel(ch)?;
        if c.state != State::Running || c.listen_only {
            return Err(Error::State);
        }
        let fd_enabled = c.layout.fd;
        if self.pending.len() >= 32 {
            return Err(Error::QueueFull);
        }
        while self.next_echo == wire::RX_ECHO || self.pending.contains_key(&self.next_echo) {
            self.next_echo = self.next_echo.wrapping_add(1);
        }
        let echo = self.next_echo;
        let bytes = wire::encode(&frame, ch, echo, fd_enabled)?;
        self.next_echo = self.next_echo.wrapping_add(1);
        self.pending.insert(echo, (ch, frame));
        if self.transport.write(&bytes).is_err() {
            self.fail();
            return Err(Error::Transport);
        }
        Ok(echo)
    }
    pub fn receive(&mut self, bytes: &[u8]) -> Result<Event, Error> {
        let ch = *bytes.get(9).ok_or(Error::Protocol("short header"))?;
        let c = self.channel(ch)?;
        if c.state != State::Running {
            return Err(Error::State);
        }
        let packet = wire::decode(bytes, c.layout, self.config.channels)?;
        if packet.echo_id == wire::RX_ECHO {
            return Ok(Event::Received(packet));
        }
        let matches = self
            .pending
            .get(&packet.echo_id)
            .is_some_and(|(channel, frame)| {
                *channel == ch && packet.payload == wire::Payload::Frame(frame.clone())
            });
        if matches {
            self.pending.remove(&packet.echo_id);
            Ok(Event::Echo(packet))
        } else {
            Ok(Event::UnmatchedEcho(packet))
        }
    }
    /// Explicit shutdown, including faulted channels. Report any reset failure.
    pub fn shutdown(&mut self) -> Result<(), Error> {
        let mut failed = false;
        for ch in 0..self.channels.len() {
            if self.output(ch as u8, 2, &control::mode(false, 0)).is_err() {
                failed = true;
            } else {
                self.channels[ch].state = State::Stopped;
            }
        }
        if failed {
            self.fail();
            Err(Error::Transport)
        } else {
            Ok(())
        }
    }
}
