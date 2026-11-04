// SPDX-License-Identifier: AGPL-3.0-or-later
mod common;
use canharbor_core::{CanId, Frame};
use canharbor_gsusb::{
    Error,
    actor::{Actor, Notice, Start},
    control::Timing,
    device::{Event, State},
    wire,
};
use common::Fake;
use std::{thread, time::Duration};
fn config(channel: u8) -> Start {
    Start {
        channel,
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
    Frame::classic(CanId::new(0x123, false).unwrap(), vec![1, 2]).unwrap()
}
async fn next(rx: &mut tokio::sync::broadcast::Receiver<Notice>) -> Notice {
    tokio::time::timeout(Duration::from_secs(2), rx.recv())
        .await
        .unwrap()
        .unwrap()
}
#[tokio::test]
async fn owns_one_worker_for_all_channels_and_routes_echoes() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    let mut a = h.subscribe(0).await.unwrap();
    let mut b = h.subscribe(1).await.unwrap();
    h.start(config(0)).await.unwrap();
    h.start(config(1)).await.unwrap();
    h.transmit(1, frame()).await.unwrap();
    assert!(matches!(next(&mut b).await, Notice::Event(Event::Echo(_))));
    assert!(a.try_recv().is_err());
    let mut bytes = wire::encode(&frame(), 0, 1, false).unwrap();
    bytes[..4].copy_from_slice(&wire::RX_ECHO.to_le_bytes());
    fake.0.lock().unwrap().reads.push_back(Ok(bytes));
    assert!(matches!(
        next(&mut a).await,
        Notice::Event(Event::Received(_))
    ));
    h.stop(1).await.unwrap();
    assert_eq!(h.state(1).await.unwrap(), State::Stopped);
    assert_eq!(h.transmit(1, frame()).await, Err(Error::State));
    actor.close().await.unwrap();
    assert!(matches!(h.state(0).await, Err(Error::Closed)));
    let log = fake.0.lock().unwrap();
    let owner = log.threads[0];
    assert_ne!(owner, thread::current().id());
    assert!(log.threads.iter().all(|id| *id == owner));
    assert!(log.resets >= 4);
}
#[tokio::test]
async fn malformed_record_is_visible_and_later_traffic_still_arrives() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    let mut rx = h.subscribe(0).await.unwrap();
    h.start(config(0)).await.unwrap();
    fake.0.lock().unwrap().reads.push_back(Ok(vec![0; 3]));
    assert!(matches!(next(&mut rx).await, Notice::Rejected(_)));
    h.transmit(0, frame()).await.unwrap();
    assert!(matches!(next(&mut rx).await, Notice::Event(Event::Echo(_))));
    actor.close().await.unwrap();
}
#[tokio::test]
async fn transport_fault_notifies_all_channels_and_ends_streams() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    let mut a = h.subscribe(0).await.unwrap();
    let mut b = h.subscribe(1).await.unwrap();
    fake.0
        .lock()
        .unwrap()
        .reads
        .push_back(Err(Error::Transport));
    assert!(matches!(next(&mut a).await, Notice::Fault(_)));
    assert!(matches!(next(&mut b).await, Notice::Fault(_)));
    assert!(
        tokio::time::timeout(Duration::from_secs(2), a.recv())
            .await
            .unwrap()
            .is_err()
    );
    assert_eq!(h.state(0).await, Err(Error::Closed));
    assert_eq!(actor.close().await, Err(Error::Closed));
}
#[tokio::test]
async fn slow_observer_reports_lag_without_blocking_other_observers() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let h = actor.handle();
    let mut slow = h.subscribe(0).await.unwrap();
    let mut fast = h.subscribe(0).await.unwrap();
    h.start(config(0)).await.unwrap();
    for _ in 0..270 {
        h.transmit(0, frame()).await.unwrap();
        assert!(matches!(
            next(&mut fast).await,
            Notice::Event(Event::Echo(_))
        ));
    }
    assert!(matches!(
        slow.try_recv(),
        Err(tokio::sync::broadcast::error::TryRecvError::Lagged(_))
    ));
    actor.close().await.unwrap();
}

#[tokio::test]
async fn receive_only_burst_has_no_command_wait_between_records() {
    let fake = Fake::default();
    let actor = Actor::spawn(fake.clone(), 0).await.unwrap();
    let handle = actor.handle();
    let mut rx = handle.subscribe(0).await.unwrap();
    handle.start(config(0)).await.unwrap();
    let mut bytes = wire::encode(&frame(), 0, 1, false).unwrap();
    bytes[..4].copy_from_slice(&wire::RX_ECHO.to_le_bytes());
    {
        let mut state = fake.0.lock().unwrap();
        for _ in 0..200 {
            state.reads.push_back(Ok(bytes.clone()));
        }
    }
    // A 10 ms command wait per record takes at least 2 s even when input is
    // already queued. This is a regression guard, not a USB throughput claim.
    tokio::time::timeout(Duration::from_secs(1), async {
        for _ in 0..200 {
            assert!(matches!(
                rx.recv().await.unwrap(),
                Notice::Event(Event::Received(_))
            ));
        }
    })
    .await
    .unwrap();
    actor.close().await.unwrap();
}
