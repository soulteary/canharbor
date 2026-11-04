// SPDX-License-Identifier: AGPL-3.0-or-later
//! Revocable permits checked by a backend immediately before mutating I/O.
use crate::Error;
use std::{
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, Instant},
};
#[derive(Clone)]
pub struct Permit(Arc<Inner>);
struct Inner {
    revoked: AtomicBool,
    shutdown: Arc<AtomicBool>,
    until: Mutex<Instant>,
    parent: Option<Permit>,
}
impl Permit {
    pub(crate) fn new(ttl: Duration, shutdown: Arc<AtomicBool>) -> Self {
        Self(Arc::new(Inner {
            revoked: AtomicBool::new(false),
            shutdown,
            until: Mutex::new(Instant::now() + ttl),
            parent: None,
        }))
    }
    pub(crate) fn expiring_child(&self, ttl: Duration) -> Self {
        Self(Arc::new(Inner {
            revoked: AtomicBool::new(false),
            shutdown: self.0.shutdown.clone(),
            until: Mutex::new(Instant::now() + ttl),
            parent: Some(self.clone()),
        }))
    }
    pub(crate) fn same_as(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.0, &other.0)
    }
    pub fn check(&self) -> Result<(), Error> {
        if let Some(parent) = &self.0.parent {
            parent.check()?;
        }
        if self.0.shutdown.load(Ordering::Acquire)
            || self.0.revoked.load(Ordering::Acquire)
            || Instant::now() >= *self.0.until.lock().unwrap()
        {
            Err(Error::ControlExpired)
        } else {
            Ok(())
        }
    }
    pub(crate) fn renew(&self, ttl: Duration) {
        *self.0.until.lock().unwrap() = Instant::now() + ttl;
    }
    pub(crate) fn revoke(&self) {
        self.0.revoked.store(true, Ordering::Release);
    }
}
impl Drop for Inner {
    fn drop(&mut self) {
        self.revoked.store(true, Ordering::Release);
    }
}
