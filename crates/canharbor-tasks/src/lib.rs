// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded service-side periodic execution. No implicit lease renewal or restart.
use canharbor_core::{
    Frame,
    runtime::{Runtime, RuntimeError, TransmissionCancellation},
};
use futures_util::FutureExt;
use std::{
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};
use tokio::{
    sync::{Notify, Semaphore, watch},
    time::Instant,
};
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("periodic plan exceeds its count, interval or duration bounds")]
    Invalid,
    #[error("all periodic execution slots are occupied")]
    Limit,
    #[error(transparent)]
    Runtime(#[from] RuntimeError),
}
/// Supply the same owner rate limiter used for manual submissions. Returning
/// false terminates the plan; the executor never retries a rate-limited frame.
pub trait RateLimiter: Send + Sync {
    fn take(&self, owner: &str) -> bool;
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum State {
    Running,
    Cancelling,
    Completed,
    Cancelled,
    Failed,
    OutcomeUnknown,
}
#[derive(Debug, Clone)]
pub struct Report {
    pub state: State,
    pub attempted: u64,
    pub submitted: u64,
    pub failed: u64,
    pub unknown: u64,
    pub skipped: u64,
    pub max_lateness_ns: u64,
    pub total_lateness_ns: u64,
    pub reason: Option<String>,
}
impl Default for Report {
    fn default() -> Self {
        Self {
            state: State::Running,
            attempted: 0,
            submitted: 0,
            failed: 0,
            unknown: 0,
            skipped: 0,
            max_lateness_ns: 0,
            total_lateness_ns: 0,
            reason: None,
        }
    }
}
impl Report {
    pub fn finished(&self) -> bool {
        !matches!(self.state, State::Running | State::Cancelling)
    }
}
struct Cancellation {
    cancelled: AtomicBool,
    wake: Notify,
    current: Mutex<Option<TransmissionCancellation>>,
}
impl Cancellation {
    fn cancel(&self) {
        self.cancelled.store(true, Ordering::Release);
        if let Some(current) = self.current.lock().unwrap().as_ref() {
            current.cancel();
        }
        self.wake.notify_one();
    }
    fn cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Acquire)
    }
}
pub struct Task {
    cancellation: Arc<Cancellation>,
    report: watch::Receiver<Report>,
}
impl Task {
    pub fn cancel(&self) {
        self.cancellation.cancel();
    }
    pub fn report(&self) -> Report {
        self.report.borrow().clone()
    }
    /// Dropping a waiter does not cancel the owned executor.
    pub async fn wait(&self) -> Report {
        let mut receiver = self.report.clone();
        loop {
            let report = receiver.borrow().clone();
            if report.finished() {
                return report;
            }
            if receiver.changed().await.is_err() {
                return Report {
                    state: State::OutcomeUnknown,
                    reason: Some("executor accounting ended".into()),
                    ..report
                };
            }
        }
    }
}
impl Drop for Task {
    fn drop(&mut self) {
        self.cancel();
    }
}
pub struct Executor {
    runtime: Arc<Runtime>,
    rate: Arc<dyn RateLimiter>,
    slots: Arc<Semaphore>,
}
impl Executor {
    pub fn new(runtime: Arc<Runtime>, rate: Arc<dyn RateLimiter>) -> Self {
        Self {
            runtime,
            rate,
            slots: Arc::new(Semaphore::new(16)),
        }
    }
    pub async fn periodic(
        &self,
        session: &str,
        owner: &str,
        generation: u64,
        frame: Frame,
        interval: Duration,
        count: u32,
    ) -> Result<Task, Error> {
        if count == 0
            || count > 6000
            || interval < Duration::from_millis(10)
            || interval > Duration::from_secs(60)
            || interval
                .checked_mul(count - 1)
                .is_none_or(|d| d > Duration::from_secs(60))
        {
            return Err(Error::Invalid);
        }
        let slot = Arc::new(
            self.slots
                .clone()
                .try_acquire_owned()
                .map_err(|_| Error::Limit)?,
        );
        let observation = self.runtime.observe(session).await?;
        let initial = self
            .runtime
            .prepare_send(session, owner, generation, frame.clone())
            .await?;
        drop(initial);
        if observation.finished().is_some() {
            return Err(RuntimeError::InvalidState.into());
        }
        let view = self.runtime.get(session).await?;
        let simulated = self
            .runtime
            .capabilities(&view.channel)
            .map_err(RuntimeError::from)?
            .simulated;
        let cancellation = Arc::new(Cancellation {
            cancelled: AtomicBool::new(false),
            wake: Notify::new(),
            current: Mutex::new(None),
        });
        let (sender, receiver) = watch::channel(Report::default());
        let runtime = self.runtime.clone();
        let rate = self.rate.clone();
        let session = session.to_owned();
        let owner = owner.to_owned();
        let stop = cancellation.clone();
        tokio::spawn(async move {
            let mut report = Report::default();
            let execution = async {
                let started = Instant::now();
                let mut index = 0u32;
                while index < count {
                    if stop.cancelled() || observation.finished().is_some() {
                        report.state = State::Cancelled;
                        break;
                    }
                    let target = started + interval * index;
                    tokio::select! {biased;_=stop.wake.notified()=>{report.state=State::Cancelled;break;},_=tokio::time::sleep_until(target)=>{}}
                    if stop.cancelled() || observation.finished().is_some() {
                        report.state = State::Cancelled;
                        break;
                    }
                    let late = Instant::now().saturating_duration_since(target);
                    if late >= interval {
                        let missed = (late.as_nanos() / interval.as_nanos() + 1)
                            .min(u128::from(count - index))
                            as u32;
                        report.skipped += u64::from(missed);
                        index += missed;
                        sender.send_replace(report.clone());
                        continue;
                    }
                    let prepared = match runtime
                        .prepare_send(&session, &owner, generation, frame.clone())
                        .await
                    {
                        Ok(p) => p,
                        Err(error) => {
                            report.state = State::Failed;
                            report.reason = Some(error.to_string());
                            break;
                        }
                    };
                    let child = prepared.cancellation();
                    *stop.current.lock().unwrap() = Some(child.clone());
                    if stop.cancelled() || observation.finished().is_some() {
                        child.cancel();
                        report.state = State::Cancelled;
                        break;
                    }
                    if !rate.take(&owner) {
                        child.cancel();
                        report.state = State::Failed;
                        report.reason = Some("owner transmit rate exhausted".into());
                        break;
                    }
                    let late = Instant::now()
                        .saturating_duration_since(target)
                        .as_nanos()
                        .min(u128::from(u64::MAX)) as u64;
                    report.max_lateness_ns = report.max_lateness_ns.max(late);
                    report.total_lateness_ns += late;
                    report.attempted += 1;
                    sender.send_replace(report.clone());
                    let io_runtime = runtime.clone();
                    let io_slot = slot.clone();
                    let mut io = tokio::spawn(async move {
                        let _slot = io_slot;
                        io_runtime.submit_prepared(prepared).await
                    });
                    let deadline = Instant::now() + Duration::from_secs(1);
                    let outcome = tokio::select! {
                        result=&mut io=>Some(result),
                        _=tokio::time::sleep_until(deadline)=>None,
                        _=stop.wake.notified()=>{
                            child.cancel();report.state=State::Cancelling;sender.send_replace(report.clone());
                            tokio::time::timeout_at(deadline,&mut io).await.ok()
                        },
                    };
                    stop.current.lock().unwrap().take();
                    match outcome {
                        Some(Ok(Ok(()))) => report.submitted += 1,
                        Some(Ok(Err(error))) => {
                            let unknown = matches!(error, RuntimeError::SubmissionUnknown)
                                || !simulated
                                    && matches!(
                                        error,
                                        RuntimeError::Backend(canharbor_core::Error::Fault(_))
                                    );
                            if unknown {
                                report.unknown += 1;
                                report.state = State::OutcomeUnknown;
                            } else {
                                report.failed += 1;
                                report.state = State::Failed;
                            }
                            report.reason = Some(error.to_string());
                            break;
                        }
                        _ => {
                            child.cancel();
                            report.unknown += 1;
                            report.state = State::OutcomeUnknown;
                            report.reason = Some(
                                "submission did not complete before its deadline; do not retry"
                                    .into(),
                            );
                            break;
                        }
                    }
                    index += 1;
                    if stop.cancelled() {
                        report.state = State::Cancelled;
                        break;
                    }
                    report.state = State::Running;
                    sender.send_replace(report.clone());
                }
                if report.state == State::Running {
                    report.state = State::Completed;
                }
            };
            if std::panic::AssertUnwindSafe(execution)
                .catch_unwind()
                .await
                .is_err()
            {
                stop.cancel();
                report.unknown = report
                    .attempted
                    .saturating_sub(report.submitted + report.failed);
                report.state = if report.unknown > 0 {
                    State::OutcomeUnknown
                } else {
                    State::Failed
                };
                report.reason = Some("periodic executor panicked".into());
            }
            sender.send_replace(report);
        });
        Ok(Task {
            cancellation,
            report: receiver,
        })
    }
}
