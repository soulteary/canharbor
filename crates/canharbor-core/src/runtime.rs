// SPDX-License-Identifier: AGPL-3.0-or-later
use crate::{Backend, BackendEvent, BackendFault, Frame};
use std::{collections::BTreeMap, sync::Arc, time::Duration};
use tokio::{
    sync::{Mutex, broadcast},
    time::Instant,
};

const LEASE_TTL: Duration = Duration::from_secs(15);
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    ListenOnly,
    Active,
}
#[derive(Debug, Clone)]
pub struct SessionView {
    pub id: String,
    pub channel: String,
    pub mode: Mode,
    pub running: bool,
    pub revision: u64,
    pub generation: u64,
    pub controller: Option<String>,
    pub fault: Option<BackendFault>,
}
#[derive(Debug, Clone)]
pub struct Event {
    pub sequence: u64,
    pub elapsed_ns: u64,
    pub frame: Frame,
    pub direction: &'static str,
}
#[derive(Debug, thiserror::Error)]
pub enum RuntimeError {
    #[error("resource not found")]
    NotFound,
    #[error("channel already has a session")]
    Busy,
    #[error("another client holds control")]
    LeaseConflict,
    #[error("control lease is missing, expired, or stale")]
    LeaseExpired,
    #[error("operation is invalid in the current state")]
    InvalidState,
    #[error("listen-only sessions cannot transmit")]
    ListenOnly,
    #[error("session limit reached")]
    Limit,
    #[error(transparent)]
    Backend(#[from] crate::Error),
}
struct Lease {
    owner: String,
    until: Instant,
}
struct Session {
    view: SessionView,
    lease: Option<Lease>,
    idle_since: Instant,
    events: Option<broadcast::Sender<Event>>,
    seq: u64,
    backend_generation: u64,
    acquisition_started: Instant,
}
struct Inner {
    sessions: BTreeMap<String, Session>,
    next: u64,
    next_generation: u64,
}
pub struct Runtime {
    backend: Arc<dyn Backend>,
    inner: Mutex<Inner>,
    started: Instant,
}
impl Runtime {
    pub fn new(backend: Arc<dyn Backend>) -> Arc<Self> {
        Arc::new(Self {
            backend,
            inner: Mutex::new(Inner {
                sessions: BTreeMap::new(),
                next: 0,
                next_generation: 0,
            }),
            started: Instant::now(),
        })
    }
    pub fn channels(&self) -> Vec<crate::Channel> {
        self.backend.channels()
    }
    fn expire(s: &mut Session) {
        if s.lease.as_ref().is_some_and(|l| l.until <= Instant::now()) {
            s.lease = None;
            s.view.controller = None;
            s.view.running = false;
            s.view.revision += 1;
            s.idle_since = Instant::now();
        }
    }
    fn fault(s: &mut Session, fault: BackendFault) {
        s.view.fault = Some(fault);
        s.view.running = false;
        s.view.controller = None;
        s.view.revision += 1;
        s.lease = None;
        s.idle_since = Instant::now();
        // Closing the old event channel wakes subscribers. Recovery creates a
        // fresh channel; an old subscription can never resume automatically.
        s.events = None;
    }
    pub async fn maintain(&self) {
        let mut i = self.inner.lock().await;
        for s in i.sessions.values_mut() {
            Self::expire(s);
        }
        i.sessions
            .retain(|_, s| s.lease.is_some() || s.idle_since.elapsed() < Duration::from_secs(60));
    }
    pub async fn create(
        self: &Arc<Self>,
        channel: &str,
        mode: Mode,
    ) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        if i.sessions.values().any(|s| s.view.channel == channel) {
            return Err(RuntimeError::Busy);
        }
        if i.sessions.len() >= 8 {
            return Err(RuntimeError::Limit);
        }
        let mut input = self.backend.subscribe(channel)?;
        let backend_generation = self.backend.check_channel(channel)?;
        i.next += 1;
        let id = format!("s{}", i.next);
        let view = SessionView {
            id: id.clone(),
            channel: channel.into(),
            mode,
            running: false,
            revision: 1,
            generation: 0,
            controller: None,
            fault: None,
        };
        i.sessions.insert(
            id.clone(),
            Session {
                view: view.clone(),
                lease: None,
                idle_since: Instant::now(),
                events: Some(broadcast::channel(256).0),
                seq: 0,
                backend_generation,
                acquisition_started: Instant::now(),
            },
        );
        let weak = Arc::downgrade(self);
        tokio::spawn(async move {
            loop {
                // A short poll timeout lets removed sessions release their bus receiver.
                let event = match tokio::time::timeout(Duration::from_secs(1), input.recv()).await {
                    Ok(Ok(e)) => Some(e),
                    Ok(Err(broadcast::error::RecvError::Lagged(_))) => {
                        if let Some(r) = weak.upgrade() {
                            let mut i = r.inner.lock().await;
                            if let Some(s) = i.sessions.get_mut(&id) {
                                Self::fault(s, BackendFault::ReceiveOverflow);
                            }
                        }
                        continue;
                    }
                    Ok(Err(broadcast::error::RecvError::Closed)) => {
                        if let Some(r) = weak.upgrade() {
                            let mut i = r.inner.lock().await;
                            if let Some(s) = i.sessions.get_mut(&id) {
                                Self::fault(s, BackendFault::Disconnected);
                            }
                        }
                        break;
                    }
                    Err(_) => None,
                };
                let Some(r) = weak.upgrade() else { break };
                let mut i = r.inner.lock().await;
                let Some(s) = i.sessions.get_mut(&id) else {
                    break;
                };
                Self::expire(s);
                match event.as_deref() {
                    Some(BackendEvent::Fault { fault, generation })
                        if *generation > s.backend_generation =>
                    {
                        Self::fault(s, *fault)
                    }
                    Some(BackendEvent::Frame(e))
                        if s.view.running
                            && e.generation >= s.backend_generation
                            && e.received_at >= s.acquisition_started =>
                    {
                        s.seq += 1;
                        if let Some(events) = &s.events {
                            let _ = events.send(Event {
                                sequence: s.seq,
                                elapsed_ns: e
                                    .received_at
                                    .saturating_duration_since(r.started)
                                    .as_nanos()
                                    .min(u64::MAX as u128)
                                    as u64,
                                frame: e.frame.clone(),
                                direction: if e.source_channel == s.view.channel {
                                    "tx"
                                } else {
                                    "rx"
                                },
                            });
                        }
                    }
                    _ => {}
                }
            }
        });
        Ok(view)
    }
    pub async fn list(&self) -> Vec<SessionView> {
        self.maintain().await;
        self.inner
            .lock()
            .await
            .sessions
            .values()
            .map(|s| s.view.clone())
            .collect()
    }
    pub async fn get(&self, id: &str) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::expire(s);
        Ok(s.view.clone())
    }
    pub async fn acquire(&self, id: &str, owner: &str) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::expire(s);
        if s.lease.is_some() {
            return Err(RuntimeError::LeaseConflict);
        }
        i.next_generation += 1;
        let generation = i.next_generation;
        let s = i.sessions.get_mut(id).unwrap();
        s.view.generation = generation;
        s.view.controller = Some(owner.into());
        s.lease = Some(Lease {
            owner: owner.into(),
            until: Instant::now() + LEASE_TTL,
        });
        Ok(s.view.clone())
    }
    fn authorize(s: &mut Session, owner: &str, generation: u64) -> Result<(), RuntimeError> {
        Self::expire(s);
        if s.view.generation != generation || !s.lease.as_ref().is_some_and(|l| l.owner == owner) {
            return Err(RuntimeError::LeaseExpired);
        }
        Ok(())
    }
    pub async fn renew(&self, id: &str, owner: &str, g: u64) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::authorize(s, owner, g)?;
        s.lease.as_mut().unwrap().until = Instant::now() + LEASE_TTL;
        Ok(s.view.clone())
    }
    pub async fn running(
        &self,
        id: &str,
        owner: &str,
        g: u64,
        running: bool,
    ) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::authorize(s, owner, g)?;
        if running {
            s.backend_generation = match self.backend.check_channel(&s.view.channel) {
                Ok(generation) => generation,
                Err(error) => {
                    if let crate::Error::Fault(fault) = &error {
                        Self::fault(s, *fault);
                    }
                    return Err(error.into());
                }
            };
            if !s.view.running {
                s.acquisition_started = Instant::now();
            }
            s.view.fault = None;
            if s.events.is_none() {
                s.events = Some(broadcast::channel(256).0);
            }
        }
        s.view.running = running;
        s.view.revision += 1;
        Ok(s.view.clone())
    }
    pub async fn release(&self, id: &str, owner: &str, g: u64) -> Result<(), RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::authorize(s, owner, g)?;
        s.lease = None;
        s.view.controller = None;
        s.view.running = false;
        s.idle_since = Instant::now();
        s.view.revision += 1;
        Ok(())
    }
    pub async fn close(&self, id: &str, owner: &str, g: u64) -> Result<(), RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::authorize(s, owner, g)?;
        i.sessions.remove(id);
        Ok(())
    }
    pub async fn send(
        &self,
        id: &str,
        owner: &str,
        g: u64,
        frame: Frame,
    ) -> Result<(), RuntimeError> {
        let mut i = self.inner.lock().await;
        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        Self::authorize(s, owner, g)?;
        if !s.view.running {
            return Err(RuntimeError::InvalidState);
        }
        if s.view.mode == Mode::ListenOnly {
            return Err(RuntimeError::ListenOnly);
        }
        if let Err(error) = self.backend.transmit(&s.view.channel, frame) {
            if let crate::Error::Fault(fault) = &error {
                Self::fault(s, *fault);
            }
            return Err(error.into());
        }
        Ok(())
    }
    pub async fn subscribe(&self, id: &str) -> Result<broadcast::Receiver<Event>, RuntimeError> {
        let i = self.inner.lock().await;
        let s = i.sessions.get(id).ok_or(RuntimeError::NotFound)?;
        s.events.as_ref().map(|e| e.subscribe()).ok_or_else(|| {
            RuntimeError::Backend(crate::Error::Fault(
                s.view.fault.unwrap_or(BackendFault::Disconnected),
            ))
        })
    }
    pub async fn revoke(&self, owner: &str) {
        let mut i = self.inner.lock().await;
        for s in i.sessions.values_mut() {
            if s.lease.as_ref().is_some_and(|l| l.owner == owner) {
                s.lease = None;
                s.view.controller = None;
                s.view.running = false;
                s.idle_since = Instant::now();
                s.view.revision += 1;
            }
        }
    }
    pub async fn shutdown(&self) {
        self.inner.lock().await.sessions.clear();
    }
}
