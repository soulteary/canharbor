// SPDX-License-Identifier: AGPL-3.0-or-later
//! Human-readable rendering of stream events. Presentation only; the JSON
//! output remains the complete record.
use canharbor_server::dto::{BusEvent, Direction, FrameKind};

fn seconds(ns: &str) -> String {
    let ns = ns.parse::<u64>().unwrap_or_default();
    format!(
        "{:>6}.{:06}",
        ns / 1_000_000_000,
        ns % 1_000_000_000 / 1_000
    )
}

/// One line per event: time on the service's monotonic clock, direction,
/// identifier, payload length in bytes, payload and flags.
pub fn line(event: &BusEvent) -> String {
    match event {
        BusEvent::FrameReceived {
            host_monotonic_ns,
            direction,
            frame,
            ..
        } => {
            let id = if frame.extended {
                format!("{:08X}", frame.id)
            } else {
                format!("{:03X}", frame.id)
            };
            let remote = matches!(frame.kind, FrameKind::ClassicRemote);
            let mut line = format!(
                "{} {} {id:>8} [{:>2}]",
                seconds(host_monotonic_ns.as_str()),
                match direction {
                    Direction::Rx => "RX",
                    Direction::Tx => "TX",
                },
                if remote {
                    usize::from(frame.dlc)
                } else {
                    frame.data_hex.len() / 2
                },
            );
            for byte in frame.data_hex.as_bytes().chunks(2) {
                line.push(' ');
                line.push_str(&String::from_utf8_lossy(byte).to_ascii_uppercase());
            }
            for (set, flag) in [
                (remote, "RTR"),
                (matches!(frame.kind, FrameKind::FdData), "FD"),
                (frame.brs, "BRS"),
                (frame.esi, "ESI"),
            ] {
                if set {
                    line.push(' ');
                    line.push_str(flag);
                }
            }
            line
        }
        BusEvent::BusDiagnostic {
            host_monotonic_ns,
            error_classes,
            overflow,
            ..
        } => format!(
            "{} -- diagnostic classes=0x{error_classes:X}{}",
            seconds(host_monotonic_ns.as_str()),
            if *overflow { " overflow" } else { "" }
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn frame(direction: &str, frame: serde_json::Value) -> BusEvent {
        serde_json::from_value(json!({
            "type": "frame_received", "sequence": "1",
            "host_monotonic_ns": "12345678901", "timestamp_quality": "host_only",
            "device_raw_timestamp_us": null, "device_timestamp_us": null,
            "timestamp_epoch": "0", "raw_dlc": null, "direction": direction,
            "frame": frame
        }))
        .unwrap()
    }

    #[test]
    fn frames_render_as_aligned_single_lines() {
        assert_eq!(
            line(&frame(
                "rx",
                json!({"kind":"classic_data","id":0x123,"extended":false,"brs":false,"esi":false,"data_hex":"01020a0B","dlc":4})
            )),
            "    12.345678 RX      123 [ 4] 01 02 0A 0B"
        );
        assert_eq!(
            line(&frame(
                "tx",
                json!({"kind":"classic_data","id":0x123,"extended":true,"brs":false,"esi":false,"data_hex":"","dlc":0})
            )),
            "    12.345678 TX 00000123 [ 0]"
        );
        assert_eq!(
            line(&frame(
                "rx",
                json!({"kind":"classic_remote","id":0x7ff,"extended":false,"brs":false,"esi":false,"data_hex":"","dlc":8})
            )),
            "    12.345678 RX      7FF [ 8] RTR"
        );
        assert_eq!(
            line(&frame(
                "rx",
                json!({"kind":"fd_data","id":1,"extended":false,"brs":true,"esi":true,"data_hex":"aabbccddeeff001122334455","dlc":9})
            )),
            "    12.345678 RX      001 [12] AA BB CC DD EE FF 00 11 22 33 44 55 FD BRS ESI"
        );
    }

    #[test]
    fn diagnostics_are_not_rendered_as_frames() {
        let event: BusEvent = serde_json::from_value(json!({
            "type": "bus_diagnostic", "sequence": "2",
            "host_monotonic_ns": "1000", "timestamp_quality": "host_only",
            "device_raw_timestamp_us": null, "device_timestamp_us": null,
            "timestamp_epoch": "0", "error_classes": 0x44, "raw_data_hex": "",
            "overflow": true
        }))
        .unwrap();
        assert_eq!(
            line(&event),
            "     0.000001 -- diagnostic classes=0x44 overflow"
        );
    }
}
