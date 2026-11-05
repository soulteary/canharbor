// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded task ownership and results, independent of HTTP waiter lifetimes.
use crate::{ApiError, dto, tx};
use axum::http::StatusCode;
use canharbor_core::runtime::Runtime;
use canharbor_tasks::{Executor, PeriodicPlan, TaskCancellation};
use futures_util::FutureExt;
use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};
use tokio::{sync::watch, time::Instant};
use uuid::Uuid;
#[derive(Clone, PartialEq, Eq)]
pub(super) struct Key {
    pub owner: String,
    pub session: String,
    pub generation: u64,
    pub request: String,
}
struct Entry {
    key: Key,
    payload: String,
    value: dto::PeriodicTask,
    cancel: TaskCancellation,
    until: Option<Instant>,
}
pub(super) struct Manager {
    executor: Executor,
    inner: Mutex<HashMap<Uuid, Entry>>,
    closing: AtomicBool,
    shutdown: Mutex<Option<watch::Receiver<Option<u64>>>>,
    shutdown_ids: Mutex<Option<Vec<Uuid>>>,
}
fn missing() -> ApiError {
    ApiError::new(
        StatusCode::NOT_FOUND,
        "task_not_found",
        "periodic task not found",
    )
}
impl Manager {
    pub fn new(runtime: Arc<Runtime>, rate: Arc<tx::Manager>) -> Arc<Self> {
        Arc::new(Self {
            executor: Executor::new(runtime, rate),
            inner: Mutex::new(HashMap::new()),
            closing: AtomicBool::new(false),
            shutdown: Mutex::new(None),
            shutdown_ids: Mutex::new(None),
        })
    }
    fn prune(inner: &mut HashMap<Uuid, Entry>) {
        let now = Instant::now();
        inner.retain(|_, e| e.until.is_none_or(|until| until > now));
    }
    fn find(
        inner: &HashMap<Uuid, Entry>,
        key: &Key,
        payload: &str,
    ) -> Result<Option<dto::PeriodicTask>, ApiError> {
        if let Some(e) = inner.values().find(|e| &e.key == key) {
            if e.payload != payload {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "request_conflict",
                    "task request ID was used with another plan",
                ));
            }
            return Ok(Some(e.value.clone()));
        }
        Ok(None)
    }
    pub fn existing(
        &self,
        key: &Key,
        payload: &str,
    ) -> Result<Option<dto::PeriodicTask>, ApiError> {
        let mut inner = self.inner.lock().unwrap();
        Self::prune(&mut inner);
        Self::find(&inner, key, payload)
    }
    pub fn start(
        self: &Arc<Self>,
        key: Key,
        payload: String,
        plan: PeriodicPlan,
        epoch: u64,
    ) -> Result<dto::PeriodicTask, ApiError> {
        let id = Uuid::new_v4();
        let cancel = TaskCancellation::default();
        let value = dto::PeriodicTask {
            id: id.to_string(),
            session_id: key.session.clone(),
            client_request_id: key.request.clone(),
            generation: key.generation.into(),
            state: dto::TaskState::Starting,
            planned: u64::from(plan.count).into(),
            attempted: 0.into(),
            submitted: 0.into(),
            failed: 0.into(),
            unknown: 0.into(),
            skipped: 0.into(),
            max_dispatch_lateness_ns: 0.into(),
            total_dispatch_lateness_ns: 0.into(),
            reason: None,
        };
        {
            let mut inner = self.inner.lock().unwrap();
            Self::prune(&mut inner);
            if let Some(existing) = Self::find(&inner, &key, &payload)? {
                return Ok(existing);
            }
            if self.closing.load(Ordering::Acquire) {
                return Err(ApiError::new(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "service_closing",
                    "service is closing",
                ));
            }
            if inner.len() >= 128
                || inner.values().filter(|e| e.until.is_none()).count() >= 16
                || inner
                    .values()
                    .filter(|e| e.until.is_none() && e.key.owner == key.owner)
                    .count()
                    >= 4
            {
                return Err(ApiError::limit());
            }
            inner.insert(
                id,
                Entry {
                    key: key.clone(),
                    payload,
                    value: value.clone(),
                    cancel: cancel.clone(),
                    until: None,
                },
            );
        }
        let manager = self.clone();
        tokio::spawn(async move {
            let start = std::panic::AssertUnwindSafe(manager.executor.periodic_at(
                &key.session,
                &key.owner,
                key.generation,
                plan,
                epoch,
                cancel.clone(),
            ))
            .catch_unwind()
            .await;
            let task = match start {
                Ok(Ok(task)) => task,
                failure => {
                    let reason = match failure {
                        Ok(Err(error)) => error.to_string(),
                        Err(_) => "task startup panicked".into(),
                        _ => unreachable!(),
                    };
                    let mut inner = manager.inner.lock().unwrap();
                    let e = inner.get_mut(&id).unwrap();
                    e.value.state = if cancel.is_cancelled() {
                        dto::TaskState::Cancelled
                    } else {
                        dto::TaskState::Failed
                    };
                    e.value.reason = Some(reason);
                    e.until = Some(Instant::now() + Duration::from_secs(300));
                    return;
                }
            };
            let mut reports = task.subscribe();
            loop {
                let report = reports.borrow().clone();
                {
                    use canharbor_tasks::State;
                    let mut inner = manager.inner.lock().unwrap();
                    let e = inner.get_mut(&id).unwrap();
                    e.value.state = match report.state {
                        State::Running if cancel.is_cancelled() => dto::TaskState::Cancelling,
                        State::Running => dto::TaskState::Running,
                        State::Cancelling => dto::TaskState::Cancelling,
                        State::Completed => dto::TaskState::Completed,
                        State::Cancelled => dto::TaskState::Cancelled,
                        State::Failed => dto::TaskState::Failed,
                        State::OutcomeUnknown => dto::TaskState::OutcomeUnknown,
                    };
                    e.value.attempted = report.attempted.into();
                    e.value.submitted = report.submitted.into();
                    e.value.failed = report.failed.into();
                    e.value.unknown = report.unknown.into();
                    e.value.skipped = report.skipped.into();
                    e.value.max_dispatch_lateness_ns = report.max_lateness_ns.into();
                    e.value.total_dispatch_lateness_ns = report.total_lateness_ns.into();
                    e.value.reason = report.reason.clone();
                    if report.finished() {
                        e.until = Some(Instant::now() + Duration::from_secs(300));
                    }
                }
                if report.finished() {
                    break;
                }
                if reports.changed().await.is_err() {
                    let mut inner = manager.inner.lock().unwrap();
                    let e = inner.get_mut(&id).unwrap();
                    e.value.state = dto::TaskState::OutcomeUnknown;
                    e.value.reason = Some("task accounting unavailable".into());
                    e.until = Some(Instant::now() + Duration::from_secs(300));
                    break;
                }
            }
        });
        Ok(value)
    }
    pub fn get(&self, owner: Option<&str>, id: Uuid) -> Result<dto::PeriodicTask, ApiError> {
        let mut inner = self.inner.lock().unwrap();
        Self::prune(&mut inner);
        inner
            .get(&id)
            .filter(|e| owner.is_none_or(|o| e.key.owner == o))
            .map(|e| e.value.clone())
            .ok_or_else(missing)
    }
    pub fn list(&self, owner: Option<&str>) -> dto::PeriodicTasks {
        let mut inner = self.inner.lock().unwrap();
        Self::prune(&mut inner);
        let mut tasks: Vec<_> = inner
            .values()
            .filter(|e| owner.is_none_or(|o| e.key.owner == o))
            .map(|e| e.value.clone())
            .collect();
        tasks.sort_by(|a, b| a.id.cmp(&b.id));
        dto::PeriodicTasks { tasks }
    }
    pub fn cancel(&self, owner: Option<&str>, id: Uuid) -> Result<dto::PeriodicTask, ApiError> {
        let mut inner = self.inner.lock().unwrap();
        Self::prune(&mut inner);
        let e = inner
            .get_mut(&id)
            .filter(|e| owner.is_none_or(|owner| e.key.owner == owner))
            .ok_or_else(missing)?;
        if e.until.is_none() {
            e.cancel.cancel();
            e.value.state = dto::TaskState::Cancelling;
        }
        Ok(e.value.clone())
    }
    pub fn cancel_owner(&self, owner: &str) {
        let inner = self.inner.lock().unwrap();
        for e in inner
            .values()
            .filter(|e| e.until.is_none() && e.key.owner == owner)
        {
            e.cancel.cancel();
        }
    }
    pub fn begin_shutdown(&self) {
        self.closing.store(true, Ordering::Release);
        let inner = self.inner.lock().unwrap();
        let mut ids = self.shutdown_ids.lock().unwrap();
        if ids.is_none() {
            *ids = Some(
                inner
                    .iter()
                    .filter(|(_, e)| e.until.is_none())
                    .map(|(id, _)| *id)
                    .collect(),
            );
        }
        for e in inner.values().filter(|e| e.until.is_none()) {
            e.cancel.cancel();
        }
    }
    pub async fn shutdown(self: &Arc<Self>) -> u64 {
        self.begin_shutdown();
        let mut completion = {
            let mut shutdown = self.shutdown.lock().unwrap();
            if let Some(receiver) = shutdown.as_ref() {
                receiver.clone()
            } else {
                let ids = self.shutdown_ids.lock().unwrap().as_ref().unwrap().clone();
                let (sender, receiver) = watch::channel(None);
                *shutdown = Some(receiver.clone());
                let manager = self.clone();
                tokio::spawn(async move {
                    let until = Instant::now() + Duration::from_secs(2);
                    loop {
                        let pending = manager
                            .inner
                            .lock()
                            .unwrap()
                            .iter()
                            .any(|(id, e)| ids.contains(id) && e.until.is_none());
                        if !pending || Instant::now() >= until {
                            break;
                        }
                        tokio::time::sleep(Duration::from_millis(10)).await;
                    }
                    let inner = manager.inner.lock().unwrap();
                    let unknown = ids
                        .iter()
                        .filter(|id| {
                            inner.get(id).is_none_or(|e| {
                                e.until.is_none() || e.value.state == dto::TaskState::OutcomeUnknown
                            })
                        })
                        .count() as u64;
                    sender.send_replace(Some(unknown));
                });
                receiver
            }
        };
        loop {
            if let Some(count) = *completion.borrow() {
                return count;
            }
            if completion.changed().await.is_err() {
                return 1;
            }
        }
    }
}
