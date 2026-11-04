// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded, process-local submission accounting independent of HTTP waiters.
use crate::{ApiError, dto};
use axum::http::StatusCode;
use canharbor_core::runtime::RuntimeError;
use std::{
    collections::HashMap,
    future::Future,
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::{sync::watch, time::Instant};
#[derive(Clone, Hash, PartialEq, Eq)]
pub(super) struct Key {
    pub owner: String,
    pub session: String,
    pub generation: u64,
    pub request: String,
}
struct Record {
    value: dto::TxReceipt,
    payload: String,
    until: Option<Instant>,
    completion: watch::Receiver<Option<Result<dto::TxReceipt, ApiError>>>,
}
struct Bucket {
    credit: u64,
    last: Instant,
}
#[derive(Default)]
struct Inner {
    records: HashMap<Key, Record>,
    buckets: HashMap<String, Bucket>,
}
pub(super) struct Manager {
    inner: Mutex<Inner>,
}
pub(super) struct Receipt(watch::Receiver<Option<Result<dto::TxReceipt, ApiError>>>);
impl Receipt {
    pub async fn wait(mut self) -> Result<dto::TxReceipt, ApiError> {
        loop {
            if let Some(result) = self.0.borrow().clone() {
                return result;
            }
            self.0.changed().await.map_err(|_| {
                ApiError::new(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "outcome_unknown",
                    "submission accounting unavailable",
                )
            })?;
        }
    }
}
impl Inner {
    fn prune(&mut self, now: Instant) {
        self.records
            .retain(|_, v| v.until.is_none_or(|until| until > now));
        self.buckets
            .retain(|_, b| now.saturating_duration_since(b.last) < Duration::from_secs(300));
    }
    fn existing(&self, key: &Key, payload: &str) -> Result<Option<Receipt>, ApiError> {
        if let Some(record) = self.records.get(key) {
            if record.payload != payload {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "request_conflict",
                    "request ID was used with another frame",
                ));
            }
            return Ok(Some(Receipt(record.completion.clone())));
        }
        Ok(None)
    }
}
impl Manager {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            inner: Mutex::new(Inner::default()),
        })
    }
    pub fn existing(&self, key: &Key, payload: &str) -> Result<Option<Receipt>, ApiError> {
        let mut inner = self.inner.lock().unwrap();
        inner.prune(Instant::now());
        inner.existing(key, payload)
    }
    pub fn get(&self, owner: &str, session: &str, id: &str) -> Result<dto::TxReceipt, ApiError> {
        self.find(Some(owner), session, id)
    }
    pub fn get_native(&self, session: &str, id: &str) -> Result<dto::TxReceipt, ApiError> {
        self.find(None, session, id)
    }
    fn find(
        &self,
        owner: Option<&str>,
        session: &str,
        id: &str,
    ) -> Result<dto::TxReceipt, ApiError> {
        let mut inner = self.inner.lock().unwrap();
        inner.prune(Instant::now());
        inner
            .records
            .iter()
            .find(|(key, v)| {
                owner.is_none_or(|owner| key.owner == owner)
                    && key.session == session
                    && v.value.receipt == id
            })
            .map(|(_, v)| v.value.clone())
            .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "not_found", "receipt not found"))
    }
    pub fn submit(
        self: &Arc<Self>,
        key: Key,
        payload: String,
        simulated: bool,
        execute: impl Future<Output = Result<(), RuntimeError>> + Send + 'static,
    ) -> Result<Receipt, ApiError> {
        let mut inner = self.inner.lock().unwrap();
        let now = Instant::now();
        inner.prune(now);
        if let Some(receipt) = inner.existing(&key, &payload)? {
            return Ok(receipt);
        }
        if inner.records.len() >= 1024
            || (!inner.buckets.contains_key(&key.owner) && inner.buckets.len() >= 1024)
        {
            return Err(ApiError::limit());
        }
        let bucket = inner.buckets.entry(key.owner.clone()).or_insert(Bucket {
            credit: 200_000_000,
            last: now,
        });
        bucket.credit = bucket
            .credit
            .saturating_add(
                now.saturating_duration_since(bucket.last)
                    .as_nanos()
                    .min(u128::from(u64::MAX)) as u64,
            )
            .min(200_000_000);
        bucket.last = now;
        if bucket.credit < 10_000_000 {
            return Err(ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "tx_rate_limited",
                "transmit rate exceeds 100/s with burst 20",
            ));
        }
        bucket.credit -= 10_000_000;
        let (sender, receiver) = watch::channel(None);
        let value = dto::TxReceipt {
            receipt: uuid::Uuid::new_v4().to_string(),
            session_id: key.session.clone(),
            state: dto::TxState::Queued,
            simulated,
            confirmation: dto::Confirmation::None,
            error: None,
        };
        inner.records.insert(
            key.clone(),
            Record {
                value,
                payload,
                until: None,
                completion: receiver.clone(),
            },
        );
        drop(inner);
        let manager = self.clone();
        tokio::spawn(async move {
            // The accounting task outlives a cancelled HTTP future. Catch a
            // backend task panic as unknown rather than retaining queued forever.
            let outcome = tokio::spawn(execute).await;
            let mut inner = manager.inner.lock().unwrap();
            let record = inner.records.get_mut(&key).unwrap();
            let result = match outcome {
                Ok(Ok(())) => {
                    record.value.state = dto::TxState::Submitted;
                    record.value.confirmation = if simulated {
                        dto::Confirmation::VirtualBusAccepted
                    } else {
                        dto::Confirmation::BackendSubmitted
                    };
                    Ok(record.value.clone())
                }
                failure => {
                    let (unknown, mut error) = match failure {
                        Ok(Err(error)) => {
                            let unknown = matches!(error, RuntimeError::SubmissionUnknown)
                                || !simulated
                                    && matches!(
                                        error,
                                        RuntimeError::Backend(canharbor_core::Error::Fault(_))
                                    );
                            (unknown, ApiError::from(error))
                        }
                        Err(_) => (
                            true,
                            ApiError::new(
                                StatusCode::SERVICE_UNAVAILABLE,
                                "outcome_unknown",
                                "submission task did not complete normally",
                            ),
                        ),
                        _ => unreachable!(),
                    };
                    record.value.state = if unknown {
                        dto::TxState::OutcomeUnknown
                    } else {
                        dto::TxState::Failed
                    };
                    error.3 = Some(record.value.receipt.clone());
                    error.4 = unknown;
                    record.value.error = Some(dto::ErrorDetail {
                        code: error.1.into(),
                        message: error.2.clone(),
                        retryable: false,
                        request_id: record.value.receipt.clone(),
                        receipt: Some(record.value.receipt.clone()),
                        outcome_unknown: unknown,
                    });
                    Err(error)
                }
            };
            record.until = Some(Instant::now() + Duration::from_secs(300));
            sender.send_replace(Some(result));
        });
        Ok(Receipt(receiver))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    fn key(request: &str) -> Key {
        Key {
            owner: "owner".into(),
            session: "session".into(),
            generation: 1,
            request: request.into(),
        }
    }
    #[tokio::test]
    async fn cancelled_waiter_does_not_repeat_a_pending_submission() {
        let manager = Manager::new();
        let calls = Arc::new(AtomicUsize::new(0));
        let observed = calls.clone();
        let (entered, ready) = tokio::sync::oneshot::channel();
        let (release, wait) = tokio::sync::oneshot::channel();
        let first = manager
            .submit(key("one"), "payload".into(), false, async move {
                observed.fetch_add(1, Ordering::SeqCst);
                let _ = entered.send(());
                wait.await.unwrap();
                Ok(())
            })
            .unwrap();
        let waiter = tokio::spawn(first.wait());
        ready.await.unwrap();
        waiter.abort();
        let _ = waiter.await;
        let id = manager.inner.lock().unwrap().records[&key("one")]
            .value
            .receipt
            .clone();
        assert!(matches!(
            manager.get("owner", "session", &id).unwrap().state,
            dto::TxState::Queued
        ));
        assert!(manager.get("other", "session", &id).is_err());
        let duplicate = manager
            .submit(key("one"), "payload".into(), false, async {
                panic!("duplicate execution")
            })
            .unwrap();
        assert!(manager.existing(&key("one"), "different").is_err());
        release.send(()).unwrap();
        assert_eq!(duplicate.wait().await.unwrap().receipt, id);
        assert_eq!(calls.load(Ordering::SeqCst), 1);
        assert!(matches!(
            manager.get("owner", "session", &id).unwrap().state,
            dto::TxState::Submitted
        ));
    }
    #[tokio::test(start_paused = true)]
    async fn token_bucket_is_per_owner_and_duplicates_do_not_consume_credit() {
        let manager = Manager::new();
        for n in 0..20 {
            manager
                .submit(key(&n.to_string()), "p".into(), true, async { Ok(()) })
                .unwrap()
                .wait()
                .await
                .unwrap();
        }
        assert_eq!(
            manager
                .submit(key("full"), "p".into(), true, async { Ok(()) })
                .err()
                .unwrap()
                .1,
            "tx_rate_limited"
        );
        manager
            .submit(key("0"), "p".into(), true, async { panic!("duplicate") })
            .unwrap()
            .wait()
            .await
            .unwrap();
        tokio::time::advance(Duration::from_millis(9)).await;
        assert!(
            manager
                .submit(key("still-full"), "p".into(), true, async { Ok(()) })
                .is_err()
        );
        tokio::time::advance(Duration::from_millis(1)).await;
        manager
            .submit(key("refill"), "p".into(), true, async { Ok(()) })
            .unwrap()
            .wait()
            .await
            .unwrap();
        let mut other = key("other");
        other.owner = "other".into();
        manager
            .submit(other, "p".into(), true, async { Ok(()) })
            .unwrap()
            .wait()
            .await
            .unwrap();
    }
    #[tokio::test(start_paused = true)]
    async fn cache_capacity_does_not_evict_inside_window_or_while_pending() {
        let manager = Manager::new();
        for n in 0..1023 {
            let mut k = key(&n.to_string());
            k.owner = n.to_string();
            manager
                .submit(k, "p".into(), true, async { Ok(()) })
                .unwrap()
                .wait()
                .await
                .unwrap();
        }
        let (release, wait) = tokio::sync::oneshot::channel();
        let mut pending = key("pending");
        pending.owner = "pending".into();
        let receipt = manager
            .submit(pending.clone(), "p".into(), true, async {
                wait.await.unwrap();
                Ok(())
            })
            .unwrap();
        assert_eq!(
            manager
                .submit(key("over-capacity"), "p".into(), true, async {
                    panic!("full cache executed")
                })
                .err()
                .unwrap()
                .1,
            "resource_limit"
        );
        tokio::time::advance(Duration::from_secs(301)).await;
        assert!(manager.existing(&pending, "p").unwrap().is_some());
        assert_eq!(manager.inner.lock().unwrap().records.len(), 1);
        manager
            .submit(key("after-expiry"), "p".into(), true, async { Ok(()) })
            .unwrap()
            .wait()
            .await
            .unwrap();
        release.send(()).unwrap();
        receipt.wait().await.unwrap();
    }
    #[tokio::test]
    async fn failed_and_unknown_outcomes_are_retained_with_stable_receipt_ids() {
        let manager = Manager::new();
        for (name, simulated, unknown) in [("native", false, true), ("virtual", true, false)] {
            let receipt = manager
                .submit(key(name), "p".into(), simulated, async {
                    Err(RuntimeError::Backend(canharbor_core::Error::Fault(
                        canharbor_core::BackendFault::TransmitFailed,
                    )))
                })
                .unwrap();
            let error = receipt.wait().await.err().unwrap();
            let id = error.3.unwrap();
            let value = manager.get("owner", "session", &id).unwrap();
            assert_eq!(matches!(value.state, dto::TxState::OutcomeUnknown), unknown);
            assert!(!value.error.unwrap().retryable);
            let again = manager
                .existing(&key(name), "p")
                .unwrap()
                .unwrap()
                .wait()
                .await
                .err()
                .unwrap();
            assert_eq!(again.3.as_deref(), Some(id.as_str()));
        }
        let error = manager
            .submit(key("panic"), "p".into(), true, async {
                panic!("injected executor panic")
            })
            .unwrap()
            .wait()
            .await
            .err()
            .unwrap();
        assert!(matches!(
            manager
                .get("owner", "session", error.3.as_ref().unwrap())
                .unwrap()
                .state,
            dto::TxState::OutcomeUnknown
        ));
    }
}
