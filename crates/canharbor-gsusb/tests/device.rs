// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{CanId, Frame};
use canharbor_gsusb::{
    Error,
    control::{Request, Timing},
    device::{Device, Event, State, Transport},
    wire,
};
use std::sync::{Arc, Mutex};
#[derive(Debug, Clone, PartialEq, Eq)]
enum Call {
    In(Request, usize),
    Out(Request, Vec<u8>),
    Write(Vec<u8>),
}
#[derive(Default)]
struct Log {
    calls: Vec<Call>,
    fail: bool,
    short: bool,
    features: Option<u32>,
}
#[derive(Clone, Default)]
struct Fake(Arc<Mutex<Log>>);
impl Transport for Fake {
    fn control_in(&mut self, r: Request, n: usize) -> Result<Vec<u8>, Error> {
        let mut log = self.0.lock().unwrap();
        log.calls.push(Call::In(r.clone(), n));
        if log.fail {
            return Err(Error::Transport);
        }
        if log.short {
            return Ok(vec![0]);
        }
        let features = log.features.unwrap_or(0x511);
        Ok(match r.request {
            5 => vec![0, 0, 0, 1, 1, 0, 0, 0, 2, 0, 0, 0],
            4 | 11 => {
                let mut words = vec![features, 48_000_000, 1, 16, 1, 8, 4, 1, 1024, 1];
                if r.request == 11 {
                    words.extend([1, 16, 1, 8, 4, 1, 1024, 1]);
                }
                words.into_iter().flat_map(u32::to_le_bytes).collect()
            }
            _ => panic!("unexpected request"),
        })
    }
    fn control_out(&mut self, r: Request, data: &[u8]) -> Result<(), Error> {
        let mut log = self.0.lock().unwrap();
        log.calls.push(Call::Out(r, data.into()));
        if log.fail {
            Err(Error::Transport)
        } else {
            Ok(())
        }
    }
    fn write(&mut self, data: &[u8]) -> Result<(), Error> {
        let mut log = self.0.lock().unwrap();
        log.calls.push(Call::Write(data.into()));
        if log.fail {
            Err(Error::Transport)
        } else {
            Ok(())
        }
    }
}
fn timing() -> Timing {
    Timing {
        prop_seg: 5,
        phase_seg1: 6,
        phase_seg2: 4,
        sjw: 1,
        brp: 6,
    }
}
fn frame() -> Frame {
    Frame::classic(CanId::new(0x123, false).unwrap(), vec![1, 2, 3]).unwrap()
}
#[test]
fn initialization_and_start_use_interface_and_channel_in_correct_fields() {
    let fake = Fake::default();
    let mut d = Device::open(fake.clone(), 3).unwrap();
    assert_eq!(d.config().channels, 2);
    assert_eq!(d.state(1).unwrap(), State::Stopped);
    let calls = fake.0.lock().unwrap().calls.clone();
    assert_eq!(
        calls[0],
        Call::Out(
            Request {
                input: false,
                request: 0,
                value: 1,
                index: 3
            },
            vec![0xEF, 0xBE, 0, 0]
        )
    );
    assert_eq!(
        calls[1],
        Call::In(
            Request {
                input: true,
                request: 5,
                value: 1,
                index: 3
            },
            12
        )
    );
    assert_eq!(calls.len(), 8);
    assert!(calls.iter().all(|c| match c {
        Call::In(r, _) | Call::Out(r, _) => r.index == 3,
        _ => true,
    }));
    d.start(1, timing(), Some(timing()), true, true).unwrap();
    let log = fake.0.lock().unwrap();
    let tail = &log.calls[8..];
    assert_eq!(tail.len(), 3);
    assert_eq!(
        tail[0],
        Call::Out(
            Request {
                input: false,
                request: 1,
                value: 1,
                index: 3
            },
            timing().bytes()
        )
    );
    assert_eq!(
        tail[1],
        Call::Out(
            Request {
                input: false,
                request: 10,
                value: 1,
                index: 3
            },
            timing().bytes()
        )
    );
    assert_eq!(
        tail[2],
        Call::Out(
            Request {
                input: false,
                request: 2,
                value: 1,
                index: 3
            },
            vec![1, 0, 0, 0, 0x11, 1, 0, 0]
        )
    );
    assert!(d.transmit(1, frame()).is_err());
}
#[test]
fn unsupported_modes_and_invalid_timing_perform_no_io() {
    let fake = Fake::default();
    fake.0.lock().unwrap().features = Some(0);
    let mut d = Device::open(fake.clone(), 0).unwrap();
    let initial = fake.0.lock().unwrap().calls.len();
    assert!(d.start(0, timing(), None, true, false).is_err());
    assert!(d.start(0, timing(), None, false, true).is_err());
    assert!(d.start(0, timing(), Some(timing()), false, false).is_err());
    assert!(
        d.start(0, Timing { brp: 0, ..timing() }, None, false, false)
            .is_err()
    );
    assert_eq!(fake.0.lock().unwrap().calls.len(), initial);
    fake.0.lock().unwrap().short = true;
    assert!(Device::open(fake, 0).is_err());
}
#[test]
fn routes_channels_and_matches_echo_without_claiming_delivery() {
    let fake = Fake::default();
    let mut d = Device::open(fake, 0).unwrap();
    d.start(0, timing(), None, false, false).unwrap();
    d.start(1, timing(), None, false, false).unwrap();
    let echo = d.transmit(1, frame()).unwrap();
    assert_eq!(d.pending(), 1);
    let wrong = wire::encode(&frame(), 0, echo, false).unwrap();
    assert!(matches!(
        d.receive(&wrong).unwrap(),
        Event::UnmatchedEcho(_)
    ));
    assert_eq!(d.pending(), 1);
    let correct = wire::encode(&frame(), 1, echo, false).unwrap();
    assert!(matches!(d.receive(&correct).unwrap(), Event::Echo(_)));
    assert_eq!(d.pending(), 0);
    assert!(matches!(
        d.receive(&correct).unwrap(),
        Event::UnmatchedEcho(_)
    ));
    let mut rx = correct;
    rx[..4].copy_from_slice(&wire::RX_ECHO.to_le_bytes());
    assert!(matches!(d.receive(&rx).unwrap(), Event::Received(_)));
    d.stop(1).unwrap();
    assert!(d.receive(&rx).is_err());
    assert!(d.transmit(1, frame()).is_err());
}
#[test]
fn bounded_tx_and_transport_failure_preserve_unknown_outcomes() {
    let fake = Fake::default();
    let mut d = Device::open(fake.clone(), 0).unwrap();
    d.start(0, timing(), None, false, false).unwrap();
    for _ in 0..32 {
        d.transmit(0, frame()).unwrap();
    }
    assert_eq!(d.transmit(0, frame()), Err(Error::QueueFull));
    assert_eq!(d.pending(), 32);
    d.stop(0).unwrap();
    assert_eq!(d.pending(), 32);
    d.shutdown().unwrap();
    let fake = Fake::default();
    let mut d = Device::open(fake.clone(), 0).unwrap();
    d.start(0, timing(), None, false, false).unwrap();
    fake.0.lock().unwrap().fail = true;
    assert_eq!(d.transmit(0, frame()), Err(Error::Transport));
    assert_eq!(d.pending(), 1);
    assert_eq!(d.state(0).unwrap(), State::Faulted);
    assert_eq!(d.state(1).unwrap(), State::Faulted);
    assert_eq!(d.shutdown(), Err(Error::Transport));
    fake.0.lock().unwrap().fail = false;
    d.shutdown().unwrap();
    assert_eq!(d.state(0).unwrap(), State::Stopped);
    assert_eq!(d.pending(), 1);
}
#[test]
fn configuration_io_failure_faults_device_without_starting_other_channels() {
    let fake = Fake::default();
    let mut d = Device::open(fake.clone(), 0).unwrap();
    fake.0.lock().unwrap().fail = true;
    assert_eq!(
        d.start(0, timing(), None, false, false),
        Err(Error::Transport)
    );
    assert_eq!(d.state(0).unwrap(), State::Faulted);
    assert_eq!(d.state(1).unwrap(), State::Faulted);
    assert!(d.start(1, timing(), None, false, false).is_err());
}
