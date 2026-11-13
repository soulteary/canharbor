// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{
    Backend, BackendEvent, BackendFuture, Capabilities, Channel, Config, Error, Frame,
    control::Permit,
    runtime::{Mode, Runtime},
};
use canharbor_virtual::VirtualBus;
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
use tokio::sync::broadcast;

/// A virtual bus whose capability query can be made to panic, standing in for
/// a defect in a backend.
#[derive(Default)]
struct Faulty {
    bus: VirtualBus,
    panic_in_capabilities: AtomicBool,
}
impl Backend for Faulty {
    fn capabilities(&self, channel: &str) -> Result<Capabilities, Error> {
        if self.panic_in_capabilities.load(Ordering::Acquire) {
            panic!("backend defect");
        }
        self.bus.capabilities(channel)
    }
    fn channels(&self) -> Vec<Channel> {
        self.bus.channels()
    }
    fn subscribe(&self, channel: &str) -> Result<broadcast::Receiver<Arc<BackendEvent>>, Error> {
        self.bus.subscribe(channel)
    }
    fn check_channel(&self, channel: &str) -> Result<u64, Error> {
        self.bus.check_channel(channel)
    }
    fn transmit(&self, channel: &str, frame: Frame) -> Result<(), Error> {
        self.bus.transmit(channel, frame)
    }
    fn configure<'a>(&'a self, channel: &'a str, config: Config) -> BackendFuture<'a, ()> {
        self.bus.configure(channel, config)
    }
    fn start<'a>(&'a self, channel: &'a str, permit: Permit) -> BackendFuture<'a, ()> {
        self.bus.start(channel, permit)
    }
    fn stop<'a>(&'a self, channel: &'a str) -> BackendFuture<'a, ()> {
        self.bus.stop(channel)
    }
    fn close<'a>(&'a self, channel: &'a str) -> BackendFuture<'a, ()> {
        self.bus.close(channel)
    }
}

#[tokio::test]
async fn a_backend_panic_does_not_disable_session_management_or_shutdown() {
    let backend = Arc::new(Faulty::default());
    let runtime = Runtime::new(backend.clone());
    let existing = runtime.create("virtual:1", Mode::ListenOnly).await.unwrap();

    // The reservation path queries the backend while it holds the session
    // catalogue. The panic unwinds through that guard.
    backend.panic_in_capabilities.store(true, Ordering::Release);
    let panicked = tokio::spawn({
        let runtime = runtime.clone();
        async move {
            let _ = runtime.reserve_devices(&["virtual:0".to_owned()]).await;
        }
    })
    .await;
    assert!(panicked.unwrap_err().is_panic());
    backend
        .panic_in_capabilities
        .store(false, Ordering::Release);

    // The catalogue was only read when the panic happened. Later operations
    // must keep working, above all closing sessions and shutting down.
    assert_eq!(runtime.list().await.len(), 1);
    let reservation = runtime.reserve_devices(&["virtual:0".to_owned()]).await;
    assert!(reservation.is_err(), "virtual:1 shares the reserved device");
    let owner = "owner";
    let lease = runtime.acquire(&existing.id, owner).await.unwrap();
    runtime
        .close(&existing.id, owner, lease.generation)
        .await
        .unwrap();
    assert!(runtime.list().await.is_empty());
    drop(
        runtime
            .reserve_devices(&["virtual:0".to_owned()])
            .await
            .unwrap(),
    );
    let created = runtime.create("virtual:0", Mode::ListenOnly).await.unwrap();
    assert_eq!(runtime.list().await.len(), 1);
    let summary = runtime.shutdown().await;
    assert!(summary.failures.is_empty(), "{summary:?}");
    assert!(runtime.get(&created.id).await.is_err());
}
