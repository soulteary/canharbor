// SPDX-License-Identifier: AGPL-3.0-or-later
//! One blocking worker owns a physical device and its shared receive endpoint.
use crate::{
    Error,
    control::Timing,
    device::{Device, Event, State},
    usb::ReceiveTransport,
};
use canharbor_core::Frame;
use std::{
    sync::{
        Arc,
        mpsc::{self, SyncSender, TrySendError},
    },
    thread,
    time::Duration,
};
use tokio::sync::{broadcast, oneshot};
const COMMANDS: usize = 32;
const EVENTS: usize = 256;
const POLL: Duration = Duration::from_millis(10);
#[derive(Debug, Clone, Copy)]
pub struct Start {
    pub channel: u8,
    pub nominal: Timing,
    pub data: Option<Timing>,
    pub listen_only: bool,
    pub timestamps: bool,
}
#[derive(Debug, Clone)]
pub enum Notice {
    Event(Event),
    Rejected(Arc<Error>),
    Fault(Arc<Error>),
}
type Reply<T> = oneshot::Sender<Result<T, Error>>;
enum Command {
    Start(Start, Reply<()>),
    Stop(u8, Reply<()>),
    Tx(u8, Frame, Reply<u32>),
    State(u8, Reply<State>),
    Subscribe(u8, Reply<broadcast::Receiver<Notice>>),
    Close(Reply<()>),
}
#[derive(Clone)]
pub struct Handle {
    sender: SyncSender<Command>,
}
impl Handle {
    async fn request<T>(&self, make: impl FnOnce(Reply<T>) -> Command) -> Result<T, Error> {
        let (tx, rx) = oneshot::channel();
        self.sender.try_send(make(tx)).map_err(|e| match e {
            TrySendError::Full(_) => Error::QueueFull,
            TrySendError::Disconnected(_) => Error::Closed,
        })?;
        rx.await.map_err(|_| Error::Closed)?
    }
    pub async fn start(&self, config: Start) -> Result<(), Error> {
        self.request(|r| Command::Start(config, r)).await
    }
    pub async fn stop(&self, channel: u8) -> Result<(), Error> {
        self.request(|r| Command::Stop(channel, r)).await
    }
    pub async fn transmit(&self, channel: u8, frame: Frame) -> Result<u32, Error> {
        self.request(|r| Command::Tx(channel, frame, r)).await
    }
    pub async fn state(&self, channel: u8) -> Result<State, Error> {
        self.request(|r| Command::State(channel, r)).await
    }
    pub async fn subscribe(&self, channel: u8) -> Result<broadcast::Receiver<Notice>, Error> {
        self.request(|r| Command::Subscribe(channel, r)).await
    }
}
pub struct Actor {
    handle: Handle,
    join: Option<thread::JoinHandle<()>>,
}
impl Actor {
    /// Initialization and all transport I/O run on the worker, not a Tokio thread.
    pub async fn spawn<T: ReceiveTransport + Send + 'static>(
        transport: T,
        interface: u16,
    ) -> Result<Self, Error> {
        let (sender, commands) = mpsc::sync_channel(COMMANDS);
        let (ready_tx, ready_rx) = oneshot::channel();
        let join = thread::Builder::new()
            .name("canharbor-gsusb".into())
            .spawn(move || {
                let mut device = match Device::open(transport, interface) {
                    Ok(d) => d,
                    Err(e) => {
                        let _ = ready_tx.send(Err(e));
                        return;
                    }
                };
                let streams: Vec<_> = (0..device.config().channels)
                    .map(|_| broadcast::channel(EVENTS).0)
                    .collect();
                if ready_tx.send(Ok(())).is_err() {
                    let _ = device.shutdown();
                    return;
                }
                loop {
                    match commands.try_recv() {
                        Ok(Command::Start(c, r)) => {
                            if !r.is_closed() {
                                let _ = r.send(device.start(
                                    c.channel,
                                    c.nominal,
                                    c.data,
                                    c.listen_only,
                                    c.timestamps,
                                ));
                            }
                        }
                        Ok(Command::Stop(ch, r)) => {
                            if !r.is_closed() {
                                let _ = r.send(device.stop(ch));
                            }
                        }
                        Ok(Command::Tx(ch, f, r)) => {
                            if !r.is_closed() {
                                let _ = r.send(device.transmit(ch, f));
                            }
                        }
                        Ok(Command::State(ch, r)) => {
                            let _ = r.send(device.state(ch));
                        }
                        Ok(Command::Subscribe(ch, r)) => {
                            let _ = r.send(
                                streams
                                    .get(usize::from(ch))
                                    .map(broadcast::Sender::subscribe)
                                    .ok_or(Error::Protocol("channel")),
                            );
                        }
                        Ok(Command::Close(r)) => {
                            let _ = r.send(device.shutdown());
                            break;
                        }
                        Err(mpsc::TryRecvError::Disconnected) => {
                            let _ = device.shutdown();
                            break;
                        }
                        Err(mpsc::TryRecvError::Empty) => {}
                    }
                    if device.state(0) == Ok(State::Faulted) {
                        for stream in &streams {
                            let _ = stream.send(Notice::Fault(Arc::new(Error::Transport)));
                        }
                        let _ = device.shutdown();
                        break;
                    }
                    match device.poll(POLL) {
                        Ok(Some(event)) => {
                            let channel = match &event {
                                Event::Received(p) | Event::Echo(p) | Event::UnmatchedEcho(p) => {
                                    p.channel
                                }
                            };
                            let _ = streams[usize::from(channel)].send(Notice::Event(event));
                        }
                        Ok(None) => {}
                        Err(Error::State) => {} // a completion for a stopped channel
                        Err(e) => {
                            let fatal = matches!(e, Error::Transport);
                            let e = Arc::new(e);
                            for stream in &streams {
                                let _ = stream.send(if fatal {
                                    Notice::Fault(e.clone())
                                } else {
                                    Notice::Rejected(e.clone())
                                });
                            }
                            if fatal {
                                let _ = device.shutdown();
                                break;
                            }
                        }
                    }
                }
            })
            .map_err(|_| Error::Closed)?;
        ready_rx.await.map_err(|_| Error::Closed)??;
        Ok(Self {
            handle: Handle { sender },
            join: Some(join),
        })
    }
    pub fn handle(&self) -> Handle {
        self.handle.clone()
    }
    /// Finish device reset before returning. A later increment adds priority
    /// cancellation and bounded transport draining to this close path.
    pub async fn close(mut self) -> Result<(), Error> {
        let (tx, rx) = oneshot::channel();
        let sender = self.handle.sender.clone();
        let sent = tokio::task::spawn_blocking(move || sender.send(Command::Close(tx)))
            .await
            .map_err(|_| Error::Closed)?;
        let result = if sent.is_ok() {
            rx.await.map_err(|_| Error::Closed)?
        } else {
            Err(Error::Closed)
        };
        if let Some(join) = self.join.take() {
            tokio::task::spawn_blocking(move || join.join())
                .await
                .map_err(|_| Error::Closed)?
                .map_err(|_| Error::Closed)?;
        }
        result
    }
}
