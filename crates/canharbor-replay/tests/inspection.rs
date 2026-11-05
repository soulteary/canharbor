// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_replay::inspect;
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
