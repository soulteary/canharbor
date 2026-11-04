// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{
    Backend, BackendEvent, BackendFuture, CanId, Channel, Config, Error, Frame,
    control::Permit,
    runtime::{Mode, Runtime},
};
use canharbor_virtual::VirtualBus;
use std::sync::{
    Arc,
    atomic::{AtomicBool, AtomicUsize, Ordering},
};
use tokio::sync::{Notify, broadcast};
struct Checked {
    bus: VirtualBus,
    stops: AtomicUsize,
    closes: AtomicUsize,
    queued: Notify,
    execute: Notify,
    hold: AtomicBool,
    fail_stop: AtomicBool,
    fail_start: AtomicBool,
    delayed_fault: AtomicBool,
}
impl Default for Checked {
    fn default() -> Self {
        Self {
            bus: VirtualBus::default(),
            stops: AtomicUsize::new(0),
            closes: AtomicUsize::new(0),
            queued: Notify::new(),
            execute: Notify::new(),
            hold: AtomicBool::new(false),
            fail_stop: AtomicBool::new(false),
            fail_start: AtomicBool::new(false),
            delayed_fault: AtomicBool::new(false),
        }
    }
}
impl Backend for Checked {
    fn channels(&self) -> Vec<Channel> {
        self.bus.channels()
    }
    fn subscribe(&self, ch: &str) -> Result<broadcast::Receiver<Arc<BackendEvent>>, Error> {
        self.bus.subscribe(ch)
    }
    fn check_channel(&self, ch: &str) -> Result<u64, Error> {
        self.bus.check_channel(ch)
    }
    fn transmit(&self, ch: &str, f: Frame) -> Result<(), Error> {
        self.bus.transmit(ch, f)
    }
    fn configure<'a>(&'a self, ch: &'a str, c: Config) -> BackendFuture<'a, ()> {
        self.bus.configure(ch, c)
    }
    fn start<'a>(&'a self, ch: &'a str, p: Permit) -> BackendFuture<'a, ()> {
        if self.fail_start.load(Ordering::SeqCst) {
            return Box::pin(async { Err(Error::Fault(canharbor_core::BackendFault::BusOff)) });
        }
        self.bus.start(ch, p)
    }
    fn stop<'a>(&'a self, ch: &'a str) -> BackendFuture<'a, ()> {
        self.stops.fetch_add(1, Ordering::SeqCst);
        if self.fail_stop.load(Ordering::SeqCst) {
            return Box::pin(async { Err(Error::Fault(canharbor_core::BackendFault::StopFailed)) });
        }
        self.bus.stop(ch)
    }
    fn close<'a>(&'a self, ch: &'a str) -> BackendFuture<'a, ()> {
        self.closes.fetch_add(1, Ordering::SeqCst);
        self.bus.close(ch)
    }
    fn submit<'a>(&'a self, ch: &'a str, f: Frame, p: Permit) -> BackendFuture<'a, ()> {
        Box::pin(async move {
            if self.hold.load(Ordering::SeqCst) {
                self.queued.notify_one();
                self.execute.notified().await;
            }
            if self.delayed_fault.load(Ordering::SeqCst) {
                return Err(Error::Fault(canharbor_core::BackendFault::BusOff));
            }
            p.check()?;
            self.bus.transmit(ch, f)
        })
    }
}
#[tokio::test(start_paused = true)]
async fn expired_lease_stops_backend_and_idle_reclamation_closes_it() {
    let b = Arc::new(Checked::default());
    let r = Runtime::new(b.clone());
    let s = r.create("virtual:0", Mode::Active).await.unwrap();
    let lease = r.acquire(&s.id, "owner").await.unwrap();
    r.running(&s.id, "owner", lease.generation, true)
        .await
        .unwrap();
    tokio::time::advance(std::time::Duration::from_secs(16)).await;
    r.maintain().await;
    assert!(!r.get(&s.id).await.unwrap().running);
    assert!(b.stops.load(Ordering::SeqCst) >= 1);
    tokio::time::advance(std::time::Duration::from_secs(61)).await;
    r.maintain().await;
    assert!(r.list().await.is_empty());
    assert_eq!(b.closes.load(Ordering::SeqCst), 1);
}
#[tokio::test]
async fn revocation_invalidates_a_queued_send_before_backend_execution() {
    let b = Arc::new(Checked::default());
    let r = Runtime::new(b.clone());
    let s = r.create("virtual:0", Mode::Active).await.unwrap();
    let lease = r.acquire(&s.id, "owner").await.unwrap();
    r.running(&s.id, "owner", lease.generation, true)
        .await
        .unwrap();
    let mut events = r.subscribe(&s.id).await.unwrap();
    b.hold.store(true, Ordering::SeqCst);
    let task = {
        let r = r.clone();
        let id = s.id.clone();
        tokio::spawn(async move {
            r.send(
                &id,
                "owner",
                lease.generation,
                Frame::classic(CanId::new(1, false).unwrap(), vec![]).unwrap(),
            )
            .await
        })
    };
    b.queued.notified().await;
    r.revoke("owner").await;
    b.execute.notify_one();
    assert!(matches!(
        task.await.unwrap(),
        Err(canharbor_core::runtime::RuntimeError::Backend(
            Error::ControlExpired
        ))
    ));
    assert!(events.try_recv().is_err());
    assert!(!r.get(&s.id).await.unwrap().running);
}
#[tokio::test]
async fn release_close_and_service_shutdown_call_backend_lifecycle() {
    let b = Arc::new(Checked::default());
    let r = Runtime::new(b.clone());
    let s = r.create("virtual:0", Mode::Active).await.unwrap();
    let lease = r.acquire(&s.id, "a").await.unwrap();
    r.running(&s.id, "a", lease.generation, true).await.unwrap();
    r.release(&s.id, "a", lease.generation).await.unwrap();
    assert!(b.stops.load(Ordering::SeqCst) > 0);
    let lease = r.acquire(&s.id, "b").await.unwrap();
    r.close(&s.id, "b", lease.generation).await.unwrap();
    r.create("virtual:1", Mode::ListenOnly).await.unwrap();
    r.shutdown().await;
    assert_eq!(b.closes.load(Ordering::SeqCst), 2);
}

#[tokio::test]
async fn failed_stop_is_faulted_and_does_not_retain_control() {
    let backend = Arc::new(Checked::default());
    let runtime = Runtime::new(backend.clone());
    let session = runtime.create("virtual:0", Mode::Active).await.unwrap();
    let lease = runtime.acquire(&session.id, "owner").await.unwrap();
    runtime
        .running(&session.id, "owner", lease.generation, true)
        .await
        .unwrap();
    backend.fail_stop.store(true, Ordering::SeqCst);
    assert!(
        runtime
            .release(&session.id, "owner", lease.generation)
            .await
            .is_err()
    );
    let session = runtime.get(&session.id).await.unwrap();
    assert!(session.controller.is_none());
    assert!(!session.running);
    assert_eq!(
        session.fault,
        Some(canharbor_core::BackendFault::StopFailed)
    );
}

#[tokio::test]
async fn delayed_fault_does_not_invalidate_restart_under_same_lease() {
    let backend = Arc::new(Checked::default());
    let runtime = Runtime::new(backend.clone());
    let session = runtime.create("virtual:0", Mode::Active).await.unwrap();
    let lease = runtime.acquire(&session.id, "owner").await.unwrap();
    runtime
        .running(&session.id, "owner", lease.generation, true)
        .await
        .unwrap();
    backend.hold.store(true, Ordering::SeqCst);
    backend.delayed_fault.store(true, Ordering::SeqCst);
    let sending = {
        let runtime = runtime.clone();
        let id = session.id.clone();
        tokio::spawn(async move {
            runtime
                .send(
                    &id,
                    "owner",
                    lease.generation,
                    Frame::classic(CanId::new(1, false).unwrap(), vec![]).unwrap(),
                )
                .await
        })
    };
    backend.queued.notified().await;
    runtime
        .running(&session.id, "owner", lease.generation, false)
        .await
        .unwrap();
    runtime
        .running(&session.id, "owner", lease.generation, true)
        .await
        .unwrap();
    let mut events = runtime.subscribe(&session.id).await.unwrap();
    backend.execute.notify_one();
    assert!(sending.await.unwrap().is_err());
    let view = runtime.get(&session.id).await.unwrap();
    assert!(view.running);
    assert!(view.fault.is_none());
    assert!(view.controller.is_some());
    assert!(matches!(
        events.try_recv(),
        Err(broadcast::error::TryRecvError::Empty)
    ));
}
#[tokio::test]
async fn startup_fault_revokes_control_and_closes_stream() {
    let backend = Arc::new(Checked::default());
    let runtime = Runtime::new(backend.clone());
    let session = runtime.create("virtual:0", Mode::Active).await.unwrap();
    let lease = runtime.acquire(&session.id, "owner").await.unwrap();
    let mut events = runtime.subscribe(&session.id).await.unwrap();
    backend.fail_start.store(true, Ordering::SeqCst);
    assert!(
        runtime
            .running(&session.id, "owner", lease.generation, true)
            .await
            .is_err()
    );
    let view = runtime.get(&session.id).await.unwrap();
    assert!(!view.running);
    assert!(view.controller.is_none());
    assert_eq!(view.fault, Some(canharbor_core::BackendFault::BusOff));
    assert!(matches!(
        events.try_recv(),
        Err(broadcast::error::TryRecvError::Closed)
    ));
    assert!(backend.stops.load(Ordering::SeqCst) > 0);
}
