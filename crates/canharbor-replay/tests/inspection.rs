// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_replay::{export_candump, inspect};
use serde_json::Value;
use std::io::{Cursor, Read};
fn fixtures() -> Value {
    serde_json::from_str(include_str!("../../../api/capture-fixtures.json")).unwrap()
}
fn bytes(records: &Value) -> Vec<u8> {
    records
        .as_array()
        .unwrap()
        .iter()
        .flat_map(|r| format!("{r}\n").into_bytes())
        .collect()
}
struct Tiny(Cursor<Vec<u8>>);
impl Read for Tiny {
    fn read(&mut self, out: &mut [u8]) -> std::io::Result<usize> {
        let n = out.len().min(3);
        self.0.read(&mut out[..n])
    }
}
#[test]
fn shared_corpus_preserves_metadata_and_rejects_invalid_complete_records() {
    let fixtures = fixtures();
    for case in fixtures["valid"].as_array().unwrap() {
        let report = inspect(Tiny(Cursor::new(bytes(&case["records"]))), 500).unwrap();
        let report = serde_json::to_value(report).unwrap();
        assert_eq!(report["frames"], case["frames"], "{}", case["name"]);
        assert_eq!(report["diagnostics"], case["diagnostics"]);
        assert_eq!(report["complete"], case["complete"]);
        assert_eq!(report["preview"][0], case["records"][1]["event"]);
    }
    for case in fixtures["invalid"].as_array().unwrap() {
        assert!(
            inspect(bytes(&case["records"]).as_slice(), 500).is_err(),
            "{}",
            case["name"]
        );
    }
}
#[test]
fn preview_is_bounded_and_partial_final_record_is_never_exposed() {
    let fixtures = fixtures();
    let base = &fixtures["valid"][0]["records"];
    let mut records = vec![base[0].clone()];
    for i in 1..=1000 {
        let mut e = base[1].clone();
        e["event"]["sequence"] = i.to_string().into();
        e["event"]["host_monotonic_ns"] = i.to_string().into();
        records.push(e);
    }
    let mut data = bytes(&records.into());
    data.extend_from_slice(b"{\"record\":\"event\"");
    let report = inspect(data.as_slice(), 5).unwrap();
    assert_eq!(report.events.as_str(), "1000");
    assert_eq!(report.preview.len(), 5);
    assert!(report.truncated);
    assert!(!report.complete);
    assert_eq!(
        serde_json::to_value(&report.preview[0]).unwrap()["sequence"],
        "996"
    );
    assert!(inspect(data.as_slice(), 501).is_err());
    assert!(inspect(data.as_slice(), 0).unwrap().preview.is_empty());
}
#[test]
fn candump_export_writes_frames_and_reports_what_it_skipped() {
    let fixtures = fixtures();
    let export = |name: &str| {
        let case = fixtures["valid"]
            .as_array()
            .unwrap()
            .iter()
            .find(|case| case["name"] == name)
            .unwrap();
        let mut log = Vec::new();
        let summary =
            export_candump(Tiny(Cursor::new(bytes(&case["records"]))), &mut log, "can0").unwrap();
        (String::from_utf8(log).unwrap(), summary)
    };
    let (log, summary) = export("classic_raw_dlc_and_u64");
    assert_eq!(log, "(18446744073.709551) can0 123#0102030405060708\n");
    assert!(summary.complete);
    assert_eq!(summary.frames.as_str(), "1");
    let (log, _) = export("fd_brs_esi");
    assert!(
        log.ends_with(" can0 123##3AAAAAAAAAAAAAAAAAAAAAAAA\n"),
        "{log}"
    );
    let (log, summary) = export("diagnostic_only");
    assert!(log.is_empty());
    assert_eq!(summary.skipped_diagnostics.as_str(), "1");
    let (log, summary) = export("recoverable_prefix");
    assert_eq!(log.lines().count(), 1);
    assert!(!summary.complete);

    let base = &fixtures["valid"][0]["records"];
    let mut records = vec![base[0].clone()];
    for (i, (kind, id, extended, data, dlc)) in [
        ("classic_remote", 0x7ff, false, "", 4),
        ("classic_remote", 0x12, false, "", 0),
        ("classic_data", 0x1abc_def0, true, "", 0),
        ("fd_data", 0x12, false, "0a", 1),
    ]
    .into_iter()
    .enumerate()
    {
        let mut e = base[1].clone();
        e["event"]["sequence"] = (i + 1).to_string().into();
        e["event"]["host_monotonic_ns"] = (1_500_000_000 + i).to_string().into();
        e["event"]["raw_dlc"] = Value::Null;
        e["event"]["frame"] = serde_json::json!({
            "kind": kind, "id": id, "extended": extended, "brs": false,
            "esi": false, "data_hex": data, "dlc": dlc
        });
        records.push(e);
    }
    let mut log = Vec::new();
    export_candump(bytes(&records.into()).as_slice(), &mut log, "vcan-1").unwrap();
    assert_eq!(
        String::from_utf8(log).unwrap(),
        "(1.500000) vcan-1 7FF#R4\n(1.500000) vcan-1 012#R\n\
         (1.500000) vcan-1 1ABCDEF0#\n(1.500000) vcan-1 012##00A\n"
    );

    for case in fixtures["invalid"].as_array().unwrap() {
        assert!(
            export_candump(bytes(&case["records"]).as_slice(), Vec::new(), "can0").is_err(),
            "{}",
            case["name"]
        );
    }
    for interface in ["", "can 0", "0123456789abcdef", "can0\n"] {
        let capture = bytes(&fixtures["valid"][0]["records"]);
        assert!(export_candump(capture.as_slice(), Vec::new(), interface).is_err());
    }
}
