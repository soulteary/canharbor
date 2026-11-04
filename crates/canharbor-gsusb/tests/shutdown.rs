// SPDX-License-Identifier: AGPL-3.0-or-later
mod common;
use canharbor_core::{CanId, Frame};
use canharbor_gsusb::{
    Error,
    actor::{Actor, Start},
    control::Timing,
    device::Device,
};
use common::{Fake, Gate};
use std::{
    future::Future,
    sync::Arc,
    task::{Context, Poll, Waker},
    time::Duration,
};
fn config() -> Start {
    Start {
        channel: 0,
        nominal: Timing {
            prop_seg: 5,
            phase_seg1: 6,
            phase_seg2: 4,
            sjw: 1,
            brp: 6,
        },
        data: None,
        listen_only: false,
        timestamps: false,
    }
}
fn frame() -> Frame {
    Frame::classic(CanId::new(1, false).unwrap(), vec![1]).unwrap()
}
#[tokio::test]
async fn priority_close_rejects_full_queue_without_transmitting() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    h.start(config()).await.unwrap();
    let gate = Arc::new(Gate::default());
    fake.0.lock().unwrap().gate = Some(gate.clone());
    gate.entered();
    let mut cx = Context::from_waker(Waker::noop());
    let mut queued: Vec<_> = (0..32).map(|_| Box::pin(h.transmit(0, frame()))).collect();
    for future in &mut queued {
        assert!(future.as_mut().poll(&mut cx).is_pending());
    }
    let mut full = Box::pin(h.transmit(0, frame()));
    assert!(matches!(
        full.as_mut().poll(&mut cx),
        Poll::Ready(Err(Error::QueueFull))
    ));
    let mut close = Box::pin(actor.close());
    assert!(close.as_mut().poll(&mut cx).is_pending());
    assert_eq!(h.state(0).await, Err(Error::Closed));
    gate.release();
    let report = close.await.unwrap();
    assert!(report.reset.is_ok());
    assert!(report.drain.is_ok());
    assert!(report.unknown_transmissions.is_empty());
    for future in queued {
        assert_eq!(future.await, Err(Error::Closed));
    }
    let state = fake.0.lock().unwrap();
    assert_eq!(state.writes, 0);
    assert_eq!(state.cancels, 1);
}
#[tokio::test]
async fn dropped_queued_request_is_skipped_before_io() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    h.start(config()).await.unwrap();
    let gate = Arc::new(Gate::default());
    fake.0.lock().unwrap().gate = Some(gate.clone());
    gate.entered();
    let mut cx = Context::from_waker(Waker::noop());
    let mut pending = Box::pin(h.transmit(0, frame()));
    assert!(pending.as_mut().poll(&mut cx).is_pending());
    drop(pending);
    gate.release();
    h.state(0).await.unwrap();
    assert_eq!(fake.0.lock().unwrap().writes, 0);
    actor.close().await.unwrap();
}
#[tokio::test]
async fn owner_drop_closes_surviving_handles_and_requests_cleanup() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    let mut rx = h.subscribe(0).await.unwrap();
    drop(actor);
    assert_eq!(h.state(0).await, Err(Error::Closed));
    assert!(
        tokio::time::timeout(Duration::from_secs(2), rx.recv())
            .await
            .unwrap()
            .is_err()
    );
    assert_eq!(fake.0.lock().unwrap().cancels, 1);
}
#[test]
fn reset_and_drain_failures_preserve_unknown_tx_and_are_both_reported() {
    let fake = Fake::default();
    let mut d = Device::open(fake.clone(), 0).unwrap();
    let c = config();
    d.start(0, c.nominal, None, false, false).unwrap();
    let id = d.transmit(0, frame()).unwrap();
    {
        let mut s = fake.0.lock().unwrap();
        s.fail_reset = true;
        s.fail_cancel = true;
    }
    let report = d.close(Duration::from_secs(1));
    assert!(report.reset.is_err());
    assert!(report.drain.is_err());
    assert_eq!(report.unknown_transmissions, vec![(id, 0)]);
    let state = fake.0.lock().unwrap();
    assert_eq!(state.cancels, 1);
    assert_eq!(state.resets, 4);
}
#[test]
fn exhausted_close_budget_skips_reset_but_still_requests_cancellation() {
    let fake = Fake::default();
    let d = Device::open(fake.clone(), 0).unwrap();
    let report = d.close(Duration::ZERO);
    assert!(report.reset.is_err());
    assert!(report.drain.is_ok());
    let state = fake.0.lock().unwrap();
    assert_eq!(state.resets, 2);
    assert_eq!(state.cancels, 1);
}
