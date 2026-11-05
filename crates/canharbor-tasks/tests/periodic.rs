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
        atomic::{AtomicBool, AtomicUsize, Ordering},
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
    for _ in 0..1000 {
        if tasks.iter().all(|task| task.report().submitted == 1) {
            break;
        }
        tokio::task::yield_now().await;
    }
    assert!(tasks.iter().all(|task| task.report().submitted == 1));
    let stopped_at = tokio::time::Instant::now();
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
        assert_eq!(result.submitted, 1);
    }
    assert_eq!(tokio::time::Instant::now(), stopped_at);
    let replacement = executor
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
    assert_eq!(replacement.wait().await.state, State::Completed);
    runtime.shutdown().await;
}
struct Queued {
    bus: VirtualBus,
    entered: Notify,
    release: Notify,
    hold_other_start: AtomicBool,
    other_entered: Notify,
    other_release: Notify,
    hold_expiry_stop: AtomicBool,
    stop_entered: Notify,
    stop_reply: std::sync::Mutex<Option<tokio::sync::oneshot::Sender<Result<(), BackendError>>>>,
}
impl Queued {
    fn new() -> Self {
        Self {
            bus: VirtualBus::default(),
            entered: Notify::new(),
            release: Notify::new(),
            hold_other_start: AtomicBool::new(false),
            other_entered: Notify::new(),
            other_release: Notify::new(),
            hold_expiry_stop: AtomicBool::new(false),
            stop_entered: Notify::new(),
            stop_reply: std::sync::Mutex::new(None),
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
        Box::pin(async move {
            if c == "virtual:1" && self.hold_other_start.load(Ordering::Acquire) {
                self.other_entered.notify_one();
                self.other_release.notified().await;
            }
            self.bus.start(c, p).await
        })
    }
    fn stop<'a>(&'a self, c: &'a str) -> BackendFuture<'a, ()> {
        Box::pin(async move {
            if c == "virtual:0" && self.hold_expiry_stop.load(Ordering::Acquire) {
                let (sender, receiver) = tokio::sync::oneshot::channel();
                *self.stop_reply.lock().unwrap() = Some(sender);
                self.stop_entered.notify_one();
                receiver
                    .await
                    .map_err(|_| BackendError::Fault(canharbor_core::BackendFault::StopFailed))?
            } else {
                self.bus.stop(c).await
            }
        })
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

#[tokio::test(start_paused = true)]
async fn a_submission_just_under_two_intervals_does_not_trigger_an_overdue_dispatch() {
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
    tokio::time::advance(Duration::from_millis(19)).await;
    backend.release.notify_one();
    for _ in 0..10 {
        tokio::task::yield_now().await;
    }
    assert_eq!(task.report().attempted, 1);
    assert_eq!(task.report().skipped, 1);
    tokio::time::advance(Duration::from_millis(1)).await;
    backend.entered.notified().await;
    backend.release.notify_one();
    let report = task.wait().await;
    assert_eq!(report.submitted, 2);
    assert_eq!(report.skipped, 1);
    assert_eq!(report.state, State::Completed);
    runtime.shutdown().await;
}

#[tokio::test(start_paused = true)]
async fn a_slot_expiring_while_preparing_does_not_consume_owner_credit() {
    let backend = Arc::new(Queued::new());
    let (runtime, session, generation) = running(backend.clone()).await;
    let other = runtime.create("virtual:1", Mode::Active).await.unwrap();
    let other = runtime.acquire(&other.id, "other").await.unwrap();
    let credit = Arc::new(Credit(AtomicUsize::new(10)));
    let executor = Executor::new(runtime.clone(), credit.clone());
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
    backend.release.notify_one();
    for _ in 0..20 {
        if task.report().submitted == 1 {
            break;
        }
        tokio::task::yield_now().await;
    }
    assert_eq!(task.report().submitted, 1);
    backend.hold_other_start.store(true, Ordering::Release);
    let other_runtime = runtime.clone();
    let starting = tokio::spawn(async move {
        other_runtime
            .running(&other.id, "other", other.generation, true)
            .await
    });
    backend.other_entered.notified().await;
    tokio::time::advance(Duration::from_millis(10)).await;
    for _ in 0..10 {
        tokio::task::yield_now().await;
    }
    tokio::time::advance(Duration::from_millis(11)).await;
    backend.other_release.notify_one();
    starting.await.unwrap().unwrap();
    let report = task.wait().await;
    assert_eq!(report.state, State::Completed);
    assert_eq!(report.submitted, 1);
    assert_eq!(report.skipped, 2);
    assert_eq!(credit.0.load(Ordering::Acquire), 9);
    runtime.shutdown().await;
}

#[tokio::test(start_paused = true)]
async fn cancellation_interrupts_preparation_and_releases_its_slot_while_runtime_is_locked() {
    for drop_handle in [false, true] {
        let backend = Arc::new(Queued::new());
        let (runtime, session, generation) = running(backend.clone()).await;
        let other = runtime.create("virtual:1", Mode::Active).await.unwrap();
        let other = runtime.acquire(&other.id, "other").await.unwrap();
        let credit = Arc::new(Credit(AtomicUsize::new(10)));
        let executor = Executor::new(runtime.clone(), credit.clone());
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
        backend.release.notify_one();
        for _ in 0..20 {
            if task.report().submitted == 1 {
                break;
            }
            tokio::task::yield_now().await;
        }
        assert_eq!(task.report().submitted, 1);
        backend.hold_other_start.store(true, Ordering::Release);
        let other_runtime = runtime.clone();
        let starting = tokio::spawn(async move {
            other_runtime
                .running(&other.id, "other", other.generation, true)
                .await
        });
        backend.other_entered.notified().await;
        tokio::time::advance(Duration::from_millis(10)).await;
        for _ in 0..20 {
            tokio::task::yield_now().await;
        }
        let cancelled_at = tokio::time::Instant::now();
        if drop_handle {
            drop(task);
            for _ in 0..20 {
                tokio::task::yield_now().await;
            }
        } else {
            task.cancel();
            let report = tokio::time::timeout(Duration::from_millis(1), task.wait())
                .await
                .expect("cancelled preparation remained blocked");
            assert_eq!(report.state, State::Cancelled);
            assert_eq!(report.attempted, 1);
            assert_eq!(report.submitted, 1);
            assert_eq!(report.unknown, 0);
            drop(task);
        }
        assert_eq!(tokio::time::Instant::now(), cancelled_at);
        assert!(
            !starting.is_finished(),
            "unrelated backend start must remain blocked"
        );
        assert_eq!(credit.0.load(Ordering::Acquire), 9);
        // Each probe reserves a slot before waiting for the same runtime lock.
        // All 16 must be available before the unrelated backend call returns.
        let mut probes = vec![];
        for _ in 0..16 {
            let mut probe = Box::pin(executor.periodic(
                &session,
                "owner",
                generation,
                frame(),
                Duration::from_millis(10),
                1,
            ));
            tokio::select! {
                biased;
                result = &mut probe => panic!("expected preparation to wait for the runtime lock: {:?}", result.err()),
                _ = tokio::task::yield_now() => {}
            }
            probes.push(probe);
        }
        drop(probes);
        backend.other_release.notify_one();
        starting.await.unwrap().unwrap();
        runtime.shutdown().await;
    }
}

#[tokio::test(start_paused = true)]
async fn cancelling_preparation_preserves_expired_lease_stop_and_acquisition_cleanup() {
    let backend = Arc::new(Queued::new());
    let (runtime, session, generation) = running(backend.clone()).await;
    let observation = runtime.observe(&session).await.unwrap();
    let other = runtime.create("virtual:1", Mode::Active).await.unwrap();
    let other = runtime.acquire(&other.id, "other").await.unwrap();
    let credit = Arc::new(Credit(AtomicUsize::new(10)));
    let executor = Executor::new(runtime.clone(), credit.clone());
    let task = executor
        .periodic(
            &session,
            "owner",
            generation,
            frame(),
            Duration::from_millis(9500),
            3,
        )
        .await
        .unwrap();
    backend.entered.notified().await;
    backend.release.notify_one();
    for _ in 0..20 {
        if task.report().submitted == 1 {
            break;
        }
        tokio::task::yield_now().await;
    }
    assert_eq!(task.report().submitted, 1);
    // Queue preparation before the runtime's next one-second maintenance poll,
    // then release the lock after the lease expires. FIFO lock ordering makes
    // preparation itself perform expiry cleanup, rather than the poll task.
    tokio::time::advance(Duration::from_secs(9)).await;
    for _ in 0..20 {
        tokio::task::yield_now().await;
    }
    backend.hold_other_start.store(true, Ordering::Release);
    let other_runtime = runtime.clone();
    let starting = tokio::spawn(async move {
        other_runtime
            .running(&other.id, "other", other.generation, true)
            .await
    });
    backend.other_entered.notified().await;
    tokio::time::advance(Duration::from_millis(500)).await;
    for _ in 0..20 {
        tokio::task::yield_now().await;
    }
    backend.hold_expiry_stop.store(true, Ordering::Release);
    tokio::time::advance(Duration::from_secs(6)).await;
    backend.other_release.notify_one();
    starting.await.unwrap().unwrap();
    backend.stop_entered.notified().await;
    task.cancel();
    let report = tokio::time::timeout(Duration::from_millis(1), task.wait())
        .await
        .unwrap();
    assert_eq!(report.state, State::Cancelled);
    assert_eq!(report.attempted, 1);
    assert_eq!(report.unknown, 0);
    assert_eq!(credit.0.load(Ordering::Acquire), 9);
    let reply = backend.stop_reply.lock().unwrap().take().unwrap();
    // gs_usb skips queued stop commands when their reply receiver is closed.
    assert!(
        !reply.is_closed(),
        "cancellation abandoned the hardware stop receiver"
    );
    backend.bus.stop("virtual:0").await.unwrap();
    assert!(reply.send(Ok(())).is_ok());
    let view = runtime.get(&session).await.unwrap();
    assert!(!view.running);
    assert!(view.controller.is_none());
    assert!(observation.finished().is_some());
    runtime.maintain().await;
    assert!(
        backend.stop_reply.lock().unwrap().is_none(),
        "cleanup must not queue another stop"
    );
    backend.hold_expiry_stop.store(false, Ordering::Release);
    runtime.shutdown().await;
}
