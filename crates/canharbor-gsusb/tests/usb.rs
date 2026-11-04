// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_gsusb::{
    Error,
    usb::{self, VidPid},
};
use nusb::{
    descriptors::ConfigurationDescriptor,
    transfer::{Completion, TransferError},
};
fn descriptor(endpoints: &[[u8; 7]]) -> Vec<u8> {
    let mut v = vec![
        9,
        2,
        0,
        0,
        1,
        1,
        0,
        0x80,
        50,
        9,
        4,
        3,
        2,
        endpoints.len() as u8,
        0xff,
        0,
        0,
        0,
    ];
    for ep in endpoints {
        v.extend(ep);
    }
    let len = v.len() as u16;
    v[2..4].copy_from_slice(&len.to_le_bytes());
    v
}
fn select(v: &[u8]) -> Result<usb::Endpoints, Error> {
    usb::select_endpoints(&ConfigurationDescriptor::new(v).unwrap(), 3, 2)
}
#[test]
fn discovery_requires_explicit_vid_pid_without_opening_any_device() {
    let id = VidPid {
        vendor: 0x1d50,
        product: 0x606f,
    };
    assert!(!usb::allowed(id, &[]));
    assert!(usb::allowed(id, &[id]));
    assert!(!usb::allowed(VidPid { product: 1, ..id }, &[id]));
    assert!(usb::discover(&[]).unwrap().is_empty());
}
#[test]
fn uses_selected_interface_alternate_and_actual_endpoint_addresses() {
    let bytes = descriptor(&[[7, 5, 0x83, 2, 64, 0, 0], [7, 5, 0x05, 2, 64, 0, 0]]);
    assert_eq!(
        select(&bytes).unwrap(),
        usb::Endpoints {
            input: 0x83,
            output: 0x05
        }
    );
    let config = ConfigurationDescriptor::new(&bytes).unwrap();
    assert!(usb::select_endpoints(&config, 0, 2).is_err());
    assert!(usb::select_endpoints(&config, 3, 0).is_err());
    let mut wrong = bytes.clone();
    wrong[14] = 3;
    assert!(select(&wrong).is_err());
    let mut count = bytes;
    count[13] = 3;
    assert!(select(&count).is_err());
}
#[test]
fn rejects_missing_ambiguous_nonbulk_and_invalid_endpoints() {
    for eps in [
        vec![],
        vec![[7, 5, 0x81, 2, 64, 0, 0]],
        vec![[7, 5, 0x81, 3, 64, 0, 0], [7, 5, 1, 2, 64, 0, 0]],
        vec![
            [7, 5, 0x81, 2, 64, 0, 0],
            [7, 5, 0x82, 2, 64, 0, 0],
            [7, 5, 1, 2, 64, 0, 0],
        ],
        vec![[7, 5, 0x80, 2, 64, 0, 0], [7, 5, 1, 2, 64, 0, 0]],
        vec![[7, 5, 0x91, 2, 64, 0, 0], [7, 5, 1, 2, 64, 0, 0]],
        vec![[7, 5, 0x81, 2, 0, 0, 0], [7, 5, 1, 2, 64, 0, 0]],
    ] {
        assert!(select(&descriptor(&eps)).is_err());
    }
}
fn completion(bytes: &[u8], actual_len: usize, status: Result<(), TransferError>) -> Completion {
    Completion {
        buffer: bytes.to_vec().into(),
        actual_len,
        status,
    }
}
#[test]
fn partial_failed_transfers_are_errors_and_short_writes_never_succeed() {
    assert_eq!(
        usb::completed_read(completion(&[1, 2], 2, Ok(()))).unwrap(),
        [1, 2]
    );
    assert!(usb::completed_read(completion(&[1, 2], 1, Ok(()))).is_err());
    assert!(usb::completed_read(completion(&vec![0; 1025], 1025, Ok(()))).is_err());
    for error in [
        TransferError::Cancelled,
        TransferError::Disconnected,
        TransferError::Stall,
        TransferError::Fault,
    ] {
        assert_eq!(
            usb::completed_read(completion(&[1], 1, Err(error))),
            Err(Error::Transport)
        );
        assert_eq!(
            usb::completed_write(completion(&[1], 1, Err(error)), 1),
            Err(Error::Transport)
        );
    }
    assert!(usb::completed_write(completion(&[1], 1, Ok(())), 2).is_err());
    assert!(usb::completed_write(completion(&[1, 2], 2, Ok(())), 2).is_ok());
}
