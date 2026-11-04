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
    until: Mutex<Instant>,
}
impl Permit {
    pub(crate) fn new(ttl: Duration) -> Self {
        Self(Arc::new(Inner {
            revoked: AtomicBool::new(false),
            until: Mutex::new(Instant::now() + ttl),
        }))
    }
    pub fn check(&self) -> Result<(), Error> {
        if self.0.revoked.load(Ordering::Acquire) || Instant::now() >= *self.0.until.lock().unwrap()
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
