// SPDX-License-Identifier: AGPL-3.0-or-later
//! Two simulated channels on one virtual bus. No synthetic background traffic.
use canharbor_core::{Backend, BusFrame, Channel, Error, Frame};
use std::{collections::BTreeMap, sync::Arc};
use tokio::sync::broadcast;

pub struct VirtualBus {
    channels: BTreeMap<String, broadcast::Sender<Arc<BusFrame>>>,
}
impl Default for VirtualBus {
    fn default() -> Self {
        Self::new(256)
    }
}
impl VirtualBus {
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0);
        Self {
            channels: ["virtual:0", "virtual:1"]
                .into_iter()
                .map(|id| (id.into(), broadcast::channel(capacity).0))
                .collect(),
        }
    }
}
impl Backend for VirtualBus {
    fn channels(&self) -> Vec<Channel> {
        self.channels
            .keys()
            .map(|id| Channel {
                id: id.clone(),
                label: format!("Virtual CAN {}", id.rsplit(':').next().unwrap()),
            })
            .collect()
    }
    fn subscribe(&self, channel: &str) -> Result<broadcast::Receiver<Arc<BusFrame>>, Error> {
        self.channels
            .get(channel)
            .map(|tx| tx.subscribe())
            .ok_or(Error::UnknownChannel)
    }
    fn transmit(&self, channel: &str, frame: Frame) -> Result<(), Error> {
        if !self.channels.contains_key(channel) {
            return Err(Error::UnknownChannel);
        }
        frame.validate()?;
        let event = Arc::new(BusFrame {
            frame,
            source_channel: channel.into(),
        });
        for tx in self.channels.values() {
            let _ = tx.send(event.clone());
        }
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use canharbor_core::CanId;
    #[tokio::test]
    async fn cross_channel_delivery_and_slow_receiver_are_bounded() {
        let bus = VirtualBus::new(2);
        let mut slow = bus.subscribe("virtual:1").unwrap();
        let frame = Frame::classic(CanId::new(1, false).unwrap(), vec![42]).unwrap();
        for _ in 0..4 {
            bus.transmit("virtual:0", frame.clone()).unwrap();
        }
        assert!(matches!(
            slow.recv().await,
            Err(broadcast::error::RecvError::Lagged(2))
        ));
        let event = slow.recv().await.unwrap();
        assert_eq!(event.source_channel, "virtual:0");
        assert_eq!(event.frame, frame);
    }
    #[test]
    fn invalid_enum_cannot_bypass_validation() {
        let bus = VirtualBus::default();
        assert!(
            bus.transmit(
                "virtual:0",
                Frame::ClassicData {
                    id: CanId::new(0, false).unwrap(),
                    data: vec![0; 9]
                }
            )
            .is_err()
        );
    }
}

#[cfg(test)]
mod runtime_tests {
    use super::*;
    use canharbor_core::{
        CanId,
        runtime::{Mode, Runtime, RuntimeError},
    };
    use std::time::Duration;
    fn frame() -> Frame {
        Frame::classic(CanId::new(0x123, false).unwrap(), vec![1, 2, 3]).unwrap()
    }
    #[tokio::test(start_paused = true)]
    async fn lease_expiry_fences_old_controller_and_stops_channel() {
        let r = Runtime::new(Arc::new(VirtualBus::default()));
        let s = r.create("virtual:0", Mode::Active).await.unwrap();
        let a = r.acquire(&s.id, "a").await.unwrap();
        assert!(matches!(
            r.acquire(&s.id, "b").await,
            Err(RuntimeError::LeaseConflict)
        ));
        r.running(&s.id, "a", a.generation, true).await.unwrap();
        tokio::time::advance(Duration::from_secs(16)).await;
        assert!(matches!(
            r.send(&s.id, "a", a.generation, frame()).await,
            Err(RuntimeError::LeaseExpired)
        ));
        assert!(!r.get(&s.id).await.unwrap().running);
        let b = r.acquire(&s.id, "b").await.unwrap();
        assert!(b.generation > a.generation);
        assert!(r.running(&s.id, "a", a.generation, true).await.is_err());
        r.running(&s.id, "b", b.generation, true).await.unwrap();
        r.send(&s.id, "b", b.generation, frame()).await.unwrap();
    }
    #[tokio::test]
    async fn monitor_receives_from_other_channel_and_cannot_transmit() {
        let r = Runtime::new(Arc::new(VirtualBus::default()));
        let monitor = r.create("virtual:1", Mode::ListenOnly).await.unwrap();
        let tx = r.create("virtual:0", Mode::Active).await.unwrap();
        let m = r.acquire(&monitor.id, "monitor").await.unwrap();
        let t = r.acquire(&tx.id, "sender").await.unwrap();
        r.running(&monitor.id, "monitor", m.generation, true)
            .await
            .unwrap();
        r.running(&tx.id, "sender", t.generation, true)
            .await
            .unwrap();
        let mut input = r.subscribe(&monitor.id).await.unwrap();
        assert!(matches!(
            r.send(&monitor.id, "monitor", m.generation, frame()).await,
            Err(RuntimeError::ListenOnly)
        ));
        r.send(&tx.id, "sender", t.generation, frame())
            .await
            .unwrap();
        let event = tokio::time::timeout(Duration::from_secs(1), input.recv())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(event.frame, frame());
        assert_eq!(event.direction, "rx");
        assert_eq!(event.sequence, 1);
        r.revoke("sender").await;
        assert!(!r.get(&tx.id).await.unwrap().running);
        r.shutdown().await;
        assert!(r.list().await.is_empty());
    }
    #[tokio::test]
    async fn channel_reservation_is_exclusive() {
        let r = Runtime::new(Arc::new(VirtualBus::default()));
        r.create("virtual:0", Mode::Active).await.unwrap();
        assert!(matches!(
            r.create("virtual:0", Mode::ListenOnly).await,
            Err(RuntimeError::Busy)
        ));
        assert!(r.create("missing", Mode::Active).await.is_err());
    }
}
