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
    pub config: crate::Config,
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
    #[error("service is closing")]
    Closed,
    #[error("resource not found")]
    NotFound,
    #[error("channel already has a session")]
    Busy,
    #[error("another client holds control")]
    LeaseConflict,
    #[error("control lease is missing, expired, or stale")]
    LeaseExpired,
    #[error("resource revision changed")]
    RevisionConflict,
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
    permit: crate::control::Permit,
}
impl Drop for Lease {
    fn drop(&mut self) {
        self.permit.revoke();
    }
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
    closing: bool,
    close_summary: Option<crate::CloseSummary>,
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
                closing: false,
                close_summary: None,
                sessions: BTreeMap::new(),
                next: 0,
                next_generation: 0,
            }),
            started: Instant::now(),
        })
    }
    pub fn capabilities(&self, channel: &str) -> Result<crate::Capabilities, crate::Error> {
        self.backend.capabilities(channel)
    }
    pub fn channels(&self) -> Vec<crate::Channel> {
        self.backend.channels()
    }
    async fn expire(&self, s: &mut Session) {
        if s.lease.as_ref().is_some_and(|l| l.until <= Instant::now()) {
            if let Some(lease) = s.lease.take() {
                lease.permit.revoke();
            }
            s.view.controller = None;
            s.view.running = false;
            s.view.revision += 1;
            s.idle_since = Instant::now();
            if self.backend.stop(&s.view.channel).await.is_err() {
                self.fault(s, BackendFault::StopFailed).await;
            }
        }
    }
    async fn fault(&self, s: &mut Session, fault: BackendFault) {
        s.view.fault = Some(fault);
        s.view.running = false;
        s.view.controller = None;
        s.view.revision += 1;
        if let Some(lease) = s.lease.take() {
            lease.permit.revoke();
        }
        s.idle_since = Instant::now();
        // Closing the old event channel wakes subscribers. Recovery creates a
        // fresh channel; an old subscription can never resume automatically.
        s.events = None;
        let _ = self.backend.stop(&s.view.channel).await;
    }
    pub async fn maintain(&self) {
        let mut i = self.inner.lock().await;
        for s in i.sessions.values_mut() {
            self.expire(s).await;
        }
        let idle: Vec<_> = i
            .sessions
            .iter()
            .filter(|(_, s)| s.lease.is_none() && s.idle_since.elapsed() >= Duration::from_secs(60))
            .map(|(id, _)| id.clone())
            .collect();
        for id in idle {
            let channel = i.sessions[&id].view.channel.clone();
            if self.backend.close(&channel).await.is_ok() {
                i.sessions.remove(&id);
            } else if let Some(session) = i.sessions.get_mut(&id) {
                self.fault(session, BackendFault::StopFailed).await;
            }
        }
    }
    pub async fn create(
        self: &Arc<Self>,
        channel: &str,
        mode: Mode,
    ) -> Result<SessionView, RuntimeError> {
        self.create_configured(
            channel,
            crate::Config {
                listen_only: mode == Mode::ListenOnly,
                ..crate::Config::default()
            },
        )
        .await
    }
    pub async fn create_configured(
        self: &Arc<Self>,
        channel: &str,
        config: crate::Config,
    ) -> Result<SessionView, RuntimeError> {
        let mode = if config.listen_only {
            Mode::ListenOnly
        } else {
            Mode::Active
        };
        let mut i = self.inner.lock().await;
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        if i.sessions.values().any(|s| s.view.channel == channel) {
            return Err(RuntimeError::Busy);
        }
        if i.sessions.len() >= 8 {
            return Err(RuntimeError::Limit);
        }
        self.backend.configure(channel, config).await?;
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
            config,
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
                                r.fault(s, BackendFault::ReceiveOverflow).await;
                            }
                        }
                        continue;
                    }
                    Ok(Err(broadcast::error::RecvError::Closed)) => {
                        if let Some(r) = weak.upgrade() {
                            let mut i = r.inner.lock().await;
                            if let Some(s) = i.sessions.get_mut(&id) {
                                r.fault(s, BackendFault::Disconnected).await;
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
                r.expire(s).await;
                match event.as_deref() {
                    Some(BackendEvent::Fault { fault, generation })
                        if *generation > s.backend_generation =>
                    {
                        r.fault(s, *fault).await
                    }
                    Some(BackendEvent::Frame(e))
                        if s.view.running
                            && e.generation >= s.backend_generation
                            && e.received_at >= s.acquisition_started
                            && (!matches!(e.frame, Frame::FdData { .. })
                                || s.view.config.data_bitrate.is_some()) =>
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
        self.expire(s).await;
        Ok(s.view.clone())
    }
    pub async fn acquire(&self, id: &str, owner: &str) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.expire(s).await;
        if s.lease.is_some() {
            return Err(RuntimeError::LeaseConflict);
        }
        i.next_generation += 1;
        let generation = i.next_generation;
        let s = i.sessions.get_mut(id).unwrap();
        s.view.generation = generation;
        s.view.controller = Some(owner.into());
        s.view.revision += 1;
        s.lease = Some(Lease {
            owner: owner.into(),
            until: Instant::now() + LEASE_TTL,
            permit: crate::control::Permit::new(LEASE_TTL),
        });
        Ok(s.view.clone())
    }
    async fn authorize(
        &self,
        s: &mut Session,
        owner: &str,
        generation: u64,
    ) -> Result<(), RuntimeError> {
        self.expire(s).await;
        if s.view.generation != generation || !s.lease.as_ref().is_some_and(|l| l.owner == owner) {
            return Err(RuntimeError::LeaseExpired);
        }
        Ok(())
    }
    pub async fn renew(&self, id: &str, owner: &str, g: u64) -> Result<SessionView, RuntimeError> {
        let mut i = self.inner.lock().await;
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.authorize(s, owner, g).await?;
        let lease = s.lease.as_mut().unwrap();
        lease.until = Instant::now() + LEASE_TTL;
        lease.permit.renew(LEASE_TTL);
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
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.authorize(s, owner, g).await?;
        if s.view.running == running && s.view.fault.is_none() {
            return Ok(s.view.clone());
        }
        if running {
            s.backend_generation = match self.backend.check_channel(&s.view.channel) {
                Ok(generation) => generation,
                Err(error) => {
                    if let crate::Error::Fault(fault) = &error {
                        self.fault(s, *fault).await;
                    }
                    return Err(error.into());
                }
            };
            if !s.view.running {
                s.acquisition_started = Instant::now();
            }
            if let Err(error) = self
                .backend
                .start(&s.view.channel, s.lease.as_ref().unwrap().permit.clone())
                .await
            {
                if let crate::Error::Fault(fault) = &error {
                    self.fault(s, *fault).await;
                }
                return Err(error.into());
            }
            s.view.fault = None;
            if s.events.is_none() {
                s.events = Some(broadcast::channel(256).0);
            }
        }
        if !running {
            let lease = s.lease.as_mut().unwrap();
            lease.permit.revoke();
            lease.permit =
                crate::control::Permit::new(lease.until.saturating_duration_since(Instant::now()));
            if let Err(error) = self.backend.stop(&s.view.channel).await {
                self.fault(s, BackendFault::StopFailed).await;
                return Err(error.into());
            }
        }
        s.view.running = running;
        s.view.revision += 1;
        Ok(s.view.clone())
    }
    pub async fn configure(
        &self,
        id: &str,
        owner: &str,
        g: u64,
        revision: u64,
        config: crate::Config,
    ) -> Result<SessionView, RuntimeError> {
        let mut inner = self.inner.lock().await;
        if inner.closing {
            return Err(RuntimeError::Closed);
        }
        let session = inner.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.authorize(session, owner, g).await?;
        if session.view.running {
            return Err(RuntimeError::InvalidState);
        }
        if session.view.revision != revision {
            return Err(RuntimeError::RevisionConflict);
        }
        if let Err(error) = self.backend.configure(&session.view.channel, config).await {
            if let crate::Error::Fault(fault) = &error {
                self.fault(session, *fault).await;
            }
            return Err(error.into());
        }
        let lease = session.lease.as_mut().unwrap();
        lease.permit.revoke();
        lease.permit =
            crate::control::Permit::new(lease.until.saturating_duration_since(Instant::now()));
        session.view.config = config;
        session.view.mode = if config.listen_only {
            Mode::ListenOnly
        } else {
            Mode::Active
        };
        session.view.revision += 1;
        Ok(session.view.clone())
    }
    pub async fn release(&self, id: &str, owner: &str, g: u64) -> Result<(), RuntimeError> {
        let mut i = self.inner.lock().await;
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.authorize(s, owner, g).await?;
        if let Some(lease) = s.lease.take() {
            lease.permit.revoke();
        }
        if self.backend.stop(&s.view.channel).await.is_err() {
            self.fault(s, BackendFault::StopFailed).await;
            return Err(crate::Error::Fault(BackendFault::StopFailed).into());
        }
        s.view.controller = None;
        s.view.running = false;
        s.idle_since = Instant::now();
        s.view.revision += 1;
        Ok(())
    }
    pub async fn close(&self, id: &str, owner: &str, g: u64) -> Result<(), RuntimeError> {
        let mut i = self.inner.lock().await;
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.authorize(s, owner, g).await?;
        if let Some(lease) = s.lease.as_ref() {
            lease.permit.revoke();
        }
        if let Err(error) = self.backend.close(&s.view.channel).await {
            self.fault(s, BackendFault::StopFailed).await;
            return Err(error.into());
        }
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
        if i.closing {
            return Err(RuntimeError::Closed);
        }

        let s = i.sessions.get_mut(id).ok_or(RuntimeError::NotFound)?;
        self.authorize(s, owner, g).await?;
        if !s.view.running {
            return Err(RuntimeError::InvalidState);
        }
        if s.view.mode == Mode::ListenOnly {
            return Err(RuntimeError::ListenOnly);
        }
        if matches!(frame, Frame::FdData { .. }) && s.view.config.data_bitrate.is_none() {
            return Err(crate::Error::Unsupported.into());
        }
        let channel = s.view.channel.clone();
        let permit = s.lease.as_ref().unwrap().permit.clone();
        drop(i);
        if let Err(error) = self.backend.submit(&channel, frame, permit.clone()).await {
            let mut inner = self.inner.lock().await;
            if let Some(session) = inner.sessions.get_mut(id)
                && session.view.generation == g
                && session
                    .lease
                    .as_ref()
                    .is_some_and(|lease| lease.permit.same_as(&permit))
                && let crate::Error::Fault(fault) = &error
            {
                self.fault(session, *fault).await;
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
                if let Some(lease) = s.lease.take() {
                    lease.permit.revoke();
                }
                if self.backend.stop(&s.view.channel).await.is_err() {
                    self.fault(s, BackendFault::StopFailed).await;
                    continue;
                }
                s.view.controller = None;
                s.view.running = false;
                s.idle_since = Instant::now();
                s.view.revision += 1;
            }
        }
    }
    pub async fn shutdown(&self) -> crate::CloseSummary {
        let mut inner = self.inner.lock().await;
        if let Some(summary) = &inner.close_summary {
            return summary.clone();
        }
        inner.closing = true;
        let mut summary = crate::CloseSummary::default();
        for session in inner.sessions.values_mut() {
            if let Some(lease) = session.lease.take() {
                lease.permit.revoke();
            }
            if let Err(error) = self.backend.close(&session.view.channel).await {
                summary.failures.push(format!("channel close: {error}"));
                self.fault(session, BackendFault::StopFailed).await;
            }
        }
        inner.sessions.clear();
        match self.backend.shutdown_report().await {
            Ok(report) => {
                summary.unknown_transmissions = report.unknown_transmissions;
                summary.failures.extend(report.failures);
            }
            Err(error) => summary.failures.push(format!("backend close: {error}")),
        }
        inner.close_summary = Some(summary.clone());
        summary
    }
}
