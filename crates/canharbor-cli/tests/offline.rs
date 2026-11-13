// SPDX-License-Identifier: AGPL-3.0-or-later
use serde_json::Value;
use std::process::Command;
#[test]
fn inspect_needs_no_service_and_rejects_semantically_invalid_frames() {
    let fixtures: Value =
        serde_json::from_str(include_str!("../../../api/capture-fixtures.json")).unwrap();
    let input = test_temp_dir().join(format!(
        "ch-inspect-{}.ndjson",
        uuid::Uuid::new_v4().simple()
    ));
    for (records, code) in [
        (&fixtures["valid"][0]["records"], 0),
        (&fixtures["invalid"][0]["records"], 2),
    ] {
        let data: String = records
            .as_array()
            .unwrap()
            .iter()
            .map(|r| format!("{r}\n"))
            .collect();
        std::fs::write(&input, data).unwrap();
        let output = Command::new(env!("CARGO_BIN_EXE_canharbor"))
            .args([
                "--runtime-dir",
                "/tmp/canharbor-absent-offline",
                "capture",
                "inspect",
            ])
            .arg(&input)
            .args(["--limit", "1"])
            .output()
            .unwrap();
        assert_eq!(
            output.status.code(),
            Some(code),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        if code == 0 {
            let report: Value = serde_json::from_slice(&output.stdout).unwrap();
            assert_eq!(report["frames"], "1");
            assert_eq!(report["preview"].as_array().unwrap().len(), 1);
        } else {
            assert!(output.stdout.is_empty());
        }
    }
    std::fs::remove_file(input).unwrap();
}

#[test]
fn export_writes_a_candump_log_once_and_leaves_nothing_after_invalid_input() {
    let fixtures: Value =
        serde_json::from_str(include_str!("../../../api/capture-fixtures.json")).unwrap();
    let root = test_temp_dir().join(format!("ch-export-{}", uuid::Uuid::new_v4().simple()));
    std::fs::create_dir(&root).unwrap();
    let input = root.join("capture.ndjson");
    let output = root.join("capture.log");
    let export = |records: &Value| {
        let data: String = records
            .as_array()
            .unwrap()
            .iter()
            .map(|r| format!("{r}\n"))
            .collect();
        std::fs::write(&input, data).unwrap();
        Command::new(env!("CARGO_BIN_EXE_canharbor"))
            .args([
                "--runtime-dir",
                "/tmp/canharbor-absent-offline",
                "capture",
                "export",
            ])
            .arg(&input)
            .arg("--output")
            .arg(&output)
            .output()
            .unwrap()
    };
    let rejected = export(&fixtures["invalid"][0]["records"]);
    assert_eq!(rejected.status.code(), Some(2));
    assert!(rejected.stdout.is_empty());
    assert!(!output.exists());

    let written = export(&fixtures["valid"][0]["records"]);
    assert!(
        written.status.success(),
        "{}",
        String::from_utf8_lossy(&written.stderr)
    );
    let summary: Value = serde_json::from_slice(&written.stdout).unwrap();
    assert_eq!(summary["frames"], "1");
    assert_eq!(summary["complete"], true);
    let log = std::fs::read_to_string(&output).unwrap();
    assert_eq!(log, "(18446744073.709551) can0 123#0102030405060708\n");

    // A second run must not replace or remove the existing log.
    let repeated = export(&fixtures["valid"][0]["records"]);
    assert!(!repeated.status.success());
    assert_eq!(std::fs::read_to_string(&output).unwrap(), log);
    std::fs::remove_dir_all(root).unwrap();
}

fn test_temp_dir() -> std::path::PathBuf {
    if cfg!(windows) {
        std::env::temp_dir()
    } else {
        std::path::PathBuf::from("/tmp")
    }
}

#[test]
fn non_regular_capture_is_an_input_error() {
    let root = test_temp_dir().join(format!("ch-nonregular-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir(&root).unwrap();
    let inputs = vec![root.clone()];
    #[cfg(unix)]
    let mut inputs = inputs;
    #[cfg(unix)]
    {
        let fifo = root.join("fifo");
        let name = std::ffi::CString::new(fifo.as_os_str().as_encoded_bytes()).unwrap();
        assert_eq!(unsafe { libc::mkfifo(name.as_ptr(), 0o600) }, 0);
        inputs.push(fifo);
    }
    for input in inputs {
        let out = Command::new(env!("CARGO_BIN_EXE_canharbor"))
            .args(["capture", "inspect"])
            .arg(input)
            .output()
            .unwrap();
        assert_eq!(
            out.status.code(),
            Some(2),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
        assert!(out.stdout.is_empty());
    }
    std::fs::remove_dir_all(root).unwrap();
}
