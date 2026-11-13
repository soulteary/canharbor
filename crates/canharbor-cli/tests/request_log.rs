// SPDX-License-Identifier: AGPL-3.0-or-later
use std::{
    io::Read,
    path::Path,
    process::{Command, Stdio},
    time::{Duration, Instant},
};
fn cli(root: &Path) -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_canharbor"));
    command.arg("--runtime-dir").arg(root);
    command
}
#[test]
fn request_log_names_routes_without_identifiers_or_payloads() {
    let root = if cfg!(windows) {
        std::env::temp_dir()
    } else {
        std::path::PathBuf::from("/tmp")
    }
    .join(format!("ch-reqlog-{}", uuid::Uuid::new_v4().simple()));
    let mut service = cli(&root)
        .args(["serve", "--no-web", "--log-requests"])
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    let deadline = Instant::now() + Duration::from_secs(10);
    while !cli(&root)
        .arg("devices")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .is_ok_and(|s| s.success())
    {
        assert!(service.try_wait().unwrap().is_none(), "service exited");
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(20));
    }
    let sent = cli(&root)
        .args(["send", "--channel", "virtual:0", "--active"])
        .args(["--id", "123", "--data", "DEADBEEF"])
        .output()
        .unwrap();
    assert!(sent.status.success());
    let submitted: serde_json::Value = serde_json::from_slice(&sent.stdout).unwrap();
    let session = submitted["session_id"].as_str().unwrap();
    let missing = cli(&root)
        .args(["send", "--channel", "virtual:9", "--active"])
        .args(["--id", "123", "--data", "00"])
        .output()
        .unwrap();
    assert!(!missing.status.success());
    #[cfg(windows)]
    service.kill().unwrap();
    #[cfg(unix)]
    unsafe {
        libc::kill(service.id() as libc::pid_t, libc::SIGINT);
    }
    let mut log = String::new();
    service
        .stderr
        .take()
        .unwrap()
        .read_to_string(&mut log)
        .unwrap();
    service.wait().unwrap();
    let _ = std::fs::remove_dir_all(&root);
    for expected in [
        "request POST /api/v1/sessions -> 201",
        "request POST /api/v1/sessions/{id}/tx -> 202",
        "request DELETE /api/v1/sessions/{id} -> 204",
        "request POST /api/v1/sessions -> 404",
    ] {
        assert!(log.contains(expected), "missing {expected:?} in:\n{log}");
    }
    // Readiness polling used successful reads only.
    assert!(!log.contains("request GET"), "{log}");
    for private in [session, "DEADBEEF", "deadbeef"] {
        assert!(!log.contains(private), "{private:?} leaked into:\n{log}");
    }
}
