// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{CanId, Frame};
use canharbor_gsusb::{
    Error,
    control::{Capabilities, DeviceConfig, Timing},
    wire::{self, Layout, Payload},
};
fn id(extended: bool) -> CanId {
    CanId::new(if extended { 0x1234567 } else { 0x123 }, extended).unwrap()
}
#[test]
fn independent_classic_golden_record() {
    let bytes = [
        0x78, 0x56, 0x34, 0x12, 0x23, 0x01, 0, 0, 3, 1, 0, 0, 0xAA, 0xBB, 0xCC, 0, 0, 0, 0, 0,
    ];
    let frame = Frame::classic(id(false), vec![0xAA, 0xBB, 0xCC]).unwrap();
    assert_eq!(wire::encode(&frame, 1, 0x12345678, false).unwrap(), bytes);
    let packet = wire::decode(&bytes, Layout::default(), 2).unwrap();
    assert_eq!(packet.payload, Payload::Frame(frame));
    assert_eq!(packet.channel, 1);
    assert_eq!(packet.echo_id, 0x12345678);
    assert_eq!(packet.timestamp_us, None);
}
#[test]
fn all_fd_lengths_and_identifier_widths_roundtrip() {
    for extended in [false, true] {
        for length in [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 32, 48, 64] {
            for brs in [false, true] {
                let frame = Frame::fd(id(extended), vec![0xAB; length], brs).unwrap();
                let bytes = wire::encode(&frame, 0, 7, true).unwrap();
                assert_eq!(bytes.len(), 76);
                assert_eq!(
                    wire::decode(
                        &bytes,
                        Layout {
                            fd: true,
                            ..Layout::default()
                        },
                        1
                    )
                    .unwrap()
                    .payload,
                    Payload::Frame(frame)
                );
            }
        }
    }
}
#[test]
fn remote_frames_preserve_dlc_without_payload() {
    for dlc in 0..=8 {
        let f = Frame::remote(id(true), dlc).unwrap();
        let bytes = wire::encode(&f, 0, 1, false).unwrap();
        assert_eq!(&bytes[12..], &[0; 8]);
        assert_eq!(
            wire::decode(&bytes, Layout::default(), 1).unwrap().payload,
            Payload::Frame(f)
        );
    }
}
#[test]
fn timestamp_zero_and_wrap_values_are_retained_without_inventing_epochs() {
    for timestamp in [0u32, 1, u32::MAX] {
        for fd in [false, true] {
            let f = if fd {
                Frame::fd(id(false), vec![1; 12], true).unwrap()
            } else {
                Frame::classic(id(false), vec![]).unwrap()
            };
            let mut bytes = wire::encode(&f, 0, 1, fd).unwrap();
            bytes.extend(timestamp.to_le_bytes());
            let p = wire::decode(
                &bytes,
                Layout {
                    fd,
                    timestamps: true,
                    ..Layout::default()
                },
                1,
            )
            .unwrap();
            assert_eq!(p.timestamp_us, Some(timestamp));
            assert!(
                wire::decode(
                    &bytes,
                    Layout {
                        fd,
                        ..Layout::default()
                    },
                    1
                )
                .is_err()
            );
        }
    }
}
#[test]
fn diagnostics_overflow_and_esi_are_not_silently_discarded() {
    let mut bytes = vec![0; 20];
    bytes[..4].copy_from_slice(&wire::RX_ECHO.to_le_bytes());
    bytes[4..8].copy_from_slice(&0x20000040u32.to_le_bytes());
    bytes[8] = 8;
    bytes[10] = 1;
    bytes[12..].copy_from_slice(&[1, 2, 3, 4, 5, 6, 7, 8]);
    let packet = wire::decode(&bytes, Layout::default(), 1).unwrap();
    assert!(packet.overflow);
    assert_eq!(
        packet.payload,
        Payload::Error {
            classes: 0x40,
            data: [1, 2, 3, 4, 5, 6, 7, 8]
        }
    );
    let frame = Frame::fd(id(false), vec![0; 64], false).unwrap();
    let mut bytes = wire::encode(&frame, 0, 2, true).unwrap();
    bytes[10] |= 8;
    assert!(
        wire::decode(
            &bytes,
            Layout {
                fd: true,
                ..Layout::default()
            },
            1
        )
        .unwrap()
        .esi
    );
}
#[test]
fn classic_long_dlc_requires_explicit_quirk_and_preserves_raw_dlc() {
    let mut bytes =
        wire::encode(&Frame::classic(id(false), vec![5; 8]).unwrap(), 0, 1, false).unwrap();
    for dlc in 9..=15 {
        bytes[8] = dlc;
        assert!(matches!(
            wire::decode(&bytes, Layout::default(), 1),
            Err(Error::Unsupported(_))
        ));
        let p = wire::decode(
            &bytes,
            Layout {
                classic_len8_dlc: true,
                ..Layout::default()
            },
            1,
        )
        .unwrap();
        assert_eq!(p.dlc, dlc);
        assert_eq!(
            p.payload,
            Payload::Frame(Frame::classic(id(false), vec![5; 8]).unwrap())
        );
    }
}
#[test]
fn malformed_lengths_flags_ids_channels_and_dlc_are_rejected() {
    let base = wire::encode(&Frame::classic(id(false), vec![1]).unwrap(), 0, 1, false).unwrap();
    for n in 0..base.len() {
        assert!(wire::decode(&base[..n], Layout::default(), 1).is_err());
    }
    let mut long = base.clone();
    long.push(0);
    assert!(wire::decode(&long, Layout::default(), 1).is_err());
    for (offset, value) in [
        (8, 16),
        (9, 1),
        (10, 4),
        (10, 8),
        (10, 16),
        (11, 1),
        (5, 0x08),
    ] {
        let mut bad = base.clone();
        bad[offset] = value;
        assert!(
            wire::decode(&bad, Layout::default(), 1).is_err(),
            "{offset}:{value}"
        );
    }
    let mut fd = wire::encode(&Frame::fd(id(false), vec![], false).unwrap(), 0, 1, true).unwrap();
    assert!(wire::decode(&fd, Layout::default(), 1).is_err());
    fd[7] |= 0x40;
    assert!(
        wire::decode(
            &fd,
            Layout {
                fd: true,
                ..Layout::default()
            },
            1
        )
        .is_err()
    );
    assert!(
        wire::encode(
            &Frame::classic(id(false), vec![]).unwrap(),
            0,
            wire::RX_ECHO,
            false
        )
        .is_err()
    );
}
#[test]
fn arbitrary_bounded_input_never_panics() {
    // Deterministic corpus, not a claim of coverage-guided fuzzing.
    let mut seed = 17u32;
    for size in 0..=160 {
        for _ in 0..32 {
            let bytes: Vec<u8> = (0..size)
                .map(|_| {
                    seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
                    (seed >> 24) as u8
                })
                .collect();
            for timestamps in [false, true] {
                let _ = wire::decode(
                    &bytes,
                    Layout {
                        fd: true,
                        timestamps,
                        classic_len8_dlc: true,
                    },
                    256,
                );
            }
            let _ = Capabilities::parse(&bytes);
            let _ = DeviceConfig::parse(&bytes);
        }
    }
}
fn capabilities() -> Vec<u8> {
    [0x511u32, 48_000_000, 1, 16, 1, 8, 4, 1, 1024, 1]
        .into_iter()
        .flat_map(u32::to_le_bytes)
        .collect()
}
#[test]
fn control_responses_and_timing_are_strict() {
    let mut config = vec![0; 12];
    config[3] = 255;
    assert_eq!(DeviceConfig::parse(&config).unwrap().channels, 256);
    let mut bytes = capabilities();
    let caps = Capabilities::parse(&bytes).unwrap();
    assert!(caps.data.is_none());
    bytes.extend_from_slice(&capabilities()[8..]);
    assert!(Capabilities::parse(&bytes).unwrap().data.is_some());
    for n in 0..72 {
        if n != 40 {
            assert!(Capabilities::parse(&bytes[..n]).is_err());
        }
    }
    let timing = Timing {
        prop_seg: 5,
        phase_seg1: 6,
        phase_seg2: 4,
        sjw: 1,
        brp: 6,
    };
    timing.validate(caps.nominal).unwrap();
    assert_eq!(timing.bytes().len(), 20);
    for bad in [
        Timing {
            prop_seg: u32::MAX,
            ..timing
        },
        Timing { sjw: 5, ..timing },
        Timing { brp: 0, ..timing },
        Timing {
            phase_seg2: 0,
            ..timing
        },
    ] {
        assert!(bad.validate(caps.nominal).is_err());
    }
    let mut limits = caps.nominal;
    limits.brp_inc = 2;
    assert!(timing.validate(limits).is_err());
    let mut bad = capabilities();
    bad[36..40].fill(0);
    assert!(Capabilities::parse(&bad).is_err());
}
