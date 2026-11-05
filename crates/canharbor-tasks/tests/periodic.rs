// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{
    Backend, BackendEvent, BackendFuture, CanId, Capabilities, Channel, Config,
    Error as BackendError, Frame,
    control::Permit,
    runtime::{Mode, Runtime},
};
use canharbor_tasks::{Executor, RateLimiter, State};
use canharbor_virtual::VirtualBus;
use std::{
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
    time::Duration,
};
use tokio::sync::{Notify, broadcast};
struct Credit(AtomicUsize);
impl RateLimiter for Credit {
    fn take(&self, _: &str) -> bool {
        self.0
            .try_update(Ordering::SeqCst, Ordering::SeqCst, |n| n.checked_sub(1))
            .is_ok()
    }
}
fn frame() -> Frame {
    Frame::classic(CanId::new(0x123, false).unwrap(), vec![1]).unwrap()
}
async fn running(backend: Arc<dyn Backend>) -> (Arc<Runtime>, String, u64) {
    let runtime = Runtime::new(backend);
    let session = runtime.create("virtual:0", Mode::Active).await.unwrap();
    let acquired = runtime.acquire(&session.id, "owner").await.unwrap();
    runtime
        .running(&session.id, "owner", acquired.generation, true)
        .await
        .unwrap();
    (runtime, session.id, acquired.generation)
}
#[tokio::test(start_paused = true)]
async fn bounded_periodic_work_is_executed_by_rust_with_shared_credit() {
    let (runtime, session, generation) = running(Arc::new(VirtualBus::default())).await;
    let executor = Executor::new(runtime.clone(), Arc::new(Credit(AtomicUsize::new(3))));
    let mut received = runtime.subscribe(&session).await.unwrap();
    let task = executor
        .periodic(
            &session,
            "owner",
            generation,
            frame(),
            Duration::from_millis(10),
            3,
        )
        .await
        .unwrap();
    let report = task.wait().await;
    assert_eq!(report.state, State::Completed);
    assert_eq!(report.submitted, 3);
    assert_eq!(report.unknown, 0);
    for _ in 0..3 {
        assert_eq!(received.recv().await.unwrap().frame.id().value(), 0x123);
    }
    let denied = executor
        .periodic(
            &session,
            "owner",
            generation,
            frame(),
            Duration::from_millis(10),
            1,
        )
        .await
        .unwrap();
    assert_eq!(denied.wait().await.state, State::Failed);
    assert_eq!(denied.report().attempted, 0);
    assert!(runtime.shutdown().await.failures.is_empty());
}
#[tokio::test(start_paused = true)]
async fn plans_are_bounded_and_old_acquisitions_do_not_restart() {
    let (runtime, session, generation) = running(Arc::new(VirtualBus::default())).await;
    let executor = Executor::new(runtime.clone(), Arc::new(Credit(AtomicUsize::new(100))));
    assert!(
        executor
            .periodic(
                &session,
                "owner",
                generation,
                frame(),
                Duration::from_millis(1),
                1
            )
            .await
            .is_err()
    );
    let mut tasks = vec![];
    for _ in 0..16 {
        tasks.push(
            executor
                .periodic(
                    &session,
                    "owner",
                    generation,
                    frame(),
                    Duration::from_secs(60),
                    2,
                )
                .await
                .unwrap(),
        );
    }
    assert!(
        executor
            .periodic(
                &session,
                "owner",
                generation,
                frame(),
                Duration::from_millis(10),
                1
            )
            .await
            .is_err()
    );
    runtime
        .running(&session, "owner", generation, false)
        .await
        .unwrap();
    runtime
        .running(&session, "owner", generation, true)
        .await
        .unwrap();
    for task in tasks {
        let result = task.wait().await;
        assert_eq!(result.state, State::Cancelled);
        assert_eq!(result.submitted, 0);
    }
    runtime.shutdown().await;
}
struct Queued {
    bus: VirtualBus,
    entered: Notify,
    release: Notify,
}
impl Queued {
    fn new() -> Self {
        Self {
            bus: VirtualBus::default(),
            entered: Notify::new(),
            release: Notify::new(),
        }
    }
}
impl Backend for Queued {
    fn capabilities(&self, c: &str) -> Result<Capabilities, BackendError> {
        self.bus.capabilities(c)
    }
    fn channels(&self) -> Vec<Channel> {
        self.bus.channels()
    }
    fn subscribe(&self, c: &str) -> Result<broadcast::Receiver<Arc<BackendEvent>>, BackendError> {
        self.bus.subscribe(c)
    }
    fn check_channel(&self, c: &str) -> Result<u64, BackendError> {
        self.bus.check_channel(c)
    }
    fn transmit(&self, c: &str, f: Frame) -> Result<(), BackendError> {
        self.bus.transmit(c, f)
    }
    fn configure<'a>(&'a self, c: &'a str, config: Config) -> BackendFuture<'a, ()> {
        self.bus.configure(c, config)
    }
    fn start<'a>(&'a self, c: &'a str, p: Permit) -> BackendFuture<'a, ()> {
        self.bus.start(c, p)
    }
    fn stop<'a>(&'a self, c: &'a str) -> BackendFuture<'a, ()> {
        self.bus.stop(c)
    }
    fn close<'a>(&'a self, c: &'a str) -> BackendFuture<'a, ()> {
        self.bus.close(c)
    }
    fn submit<'a>(&'a self, c: &'a str, f: Frame, p: Permit) -> BackendFuture<'a, ()> {
        Box::pin(async move {
            self.entered.notify_one();
            self.release.notified().await;
            p.check()?;
            self.bus.submit(c, f, p).await
        })
    }
}
#[tokio::test(start_paused = true)]
async fn cancelling_a_queued_execution_revokes_it_without_revoking_the_lease() {
    let backend = Arc::new(Queued::new());
    let (runtime, session, generation) = running(backend.clone()).await;
    let executor = Executor::new(runtime.clone(), Arc::new(Credit(AtomicUsize::new(10))));
    let task = executor
        .periodic(
            &session,
            "owner",
            generation,
            frame(),
            Duration::from_millis(10),
            3,
        )
        .await
        .unwrap();
    backend.entered.notified().await;
    task.cancel();
    backend.release.notify_one();
    let report = task.wait().await;
    assert_eq!(report.submitted, 0);
    assert_eq!(report.unknown, 0);
    assert_eq!(report.failed, 1);
    assert_eq!(report.state, State::Cancelled);
    assert!(runtime.renew(&session, "owner", generation).await.is_ok());
    runtime.shutdown().await;
}
#[tokio::test(start_paused = true)]
async fn a_stalled_submission_is_unknown_and_is_not_retried() {
    let backend = Arc::new(Queued::new());
    let (runtime, session, generation) = running(backend.clone()).await;
    let executor = Executor::new(runtime.clone(), Arc::new(Credit(AtomicUsize::new(10))));
    let task = executor
        .periodic(
            &session,
            "owner",
            generation,
            frame(),
            Duration::from_millis(10),
            3,
        )
        .await
        .unwrap();
    let report = task.wait().await;
    assert_eq!(report.state, State::OutcomeUnknown);
    assert_eq!(report.attempted, 1);
    assert_eq!(report.unknown, 1);
    backend.release.notify_one();
    tokio::task::yield_now().await;
    assert!(runtime.shutdown().await.failures.is_empty());
}

#[tokio::test(start_paused = true)]
async fn missed_deadlines_are_skipped_without_a_catch_up_burst() {
    let backend = Arc::new(Queued::new());
    let (runtime, session, generation) = running(backend.clone()).await;
    let executor = Executor::new(runtime.clone(), Arc::new(Credit(AtomicUsize::new(10))));
    let task = executor
        .periodic(
            &session,
            "owner",
            generation,
            frame(),
            Duration::from_millis(10),
            6,
        )
        .await
        .unwrap();
    backend.entered.notified().await;
    tokio::time::advance(Duration::from_millis(45)).await;
    backend.release.notify_one();
    for _ in 0..10 {
        tokio::task::yield_now().await;
    }
    assert_eq!(task.report().submitted, 1);
    assert_eq!(task.report().skipped, 4);
    tokio::time::advance(Duration::from_millis(5)).await;
    backend.entered.notified().await;
    backend.release.notify_one();
    let report = task.wait().await;
    assert_eq!(report.state, State::Completed);
    assert_eq!(report.submitted, 2);
    assert_eq!(report.skipped, 4);
    runtime.shutdown().await;
}
