// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{Backend, Error, registry::Registry};
use canharbor_virtual::VirtualBus;
use std::sync::Arc;
#[test]
fn duplicate_channel_ids_are_rejected_before_routing() {
    assert!(
        Registry::new(vec![
            Arc::new(VirtualBus::default()),
            Arc::new(VirtualBus::default())
        ])
        .is_err()
    );
}
#[test]
fn capability_and_unknown_channel_routing_remain_explicit() {
    let registry = Registry::new(vec![Arc::new(VirtualBus::default())]).unwrap();
    assert_eq!(registry.channels().len(), 2);
    assert!(registry.capabilities("virtual:0").unwrap().simulated);
    assert_eq!(
        registry.check_channel("unknown"),
        Err(Error::UnknownChannel)
    );
}
