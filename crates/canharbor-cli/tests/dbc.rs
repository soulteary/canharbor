// SPDX-License-Identifier: AGPL-3.0-or-later
use std::{
    path::Path,
    process::{Command, Stdio},
    time::{Duration, Instant},
};
fn cli(root: &Path) -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_canharbor"));
    command.arg("--runtime-dir").arg(root);
    command
}
fn wait_until(what: &str, mut ready: impl FnMut() -> bool) {
    let deadline = Instant::now() + Duration::from_secs(10);
    while !ready() {
        assert!(Instant::now() < deadline, "timed out waiting for {what}");
        std::thread::sleep(Duration::from_millis(20));
    }
}
#[test]
fn monitor_appends_signals_from_a_dbc_file() {
    let root = if cfg!(windows) {
        std::env::temp_dir()
    } else {
        std::path::PathBuf::from("/tmp")
    }
    .join(format!("ch-dbc-{}", uuid::Uuid::new_v4().simple()));
    let mut service = cli(&root)
        .args(["serve", "--no-web"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    wait_until("service", || {
        cli(&root)
            .arg("devices")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok_and(|s| s.success())
    });
    // The service created the private runtime directory; keep fixtures in it.
    let dbc = root.join("vehicle.dbc");
    std::fs::write(
        &dbc,
        "BO_ 291 Engine: 4 ECU\n SG_ Speed : 0|16@1+ (0.5,0) [0|0] \"km/h\" X\n \
         SG_ Temp : 23|8@0- (1,-40) [0|0] \"degC\" X\n",
    )
    .unwrap();
    let broken = root.join("broken.dbc");
    std::fs::write(
        &broken,
        "BO_ 1 M: 8 E\n SG_ S : 0|99@1+ (1,0) [0|0] \"\" X\n",
    )
    .unwrap();
    for arguments in [
        vec!["--dbc", dbc.to_str().unwrap()],
        vec!["--format", "text", "--dbc", broken.to_str().unwrap()],
        vec!["--format", "text", "--dbc", "/nonexistent/absent.dbc"],
    ] {
        let refused = cli(&root)
            .args(["monitor", "--channel", "virtual:1", "--listen-only"])
            .args(arguments)
            .output()
            .unwrap();
        assert_eq!(refused.status.code(), Some(2));
        assert!(refused.stdout.is_empty());
    }
    let monitor = cli(&root)
        .args(["monitor", "--channel", "virtual:1", "--listen-only"])
        .args(["--count", "2", "--format", "text", "--dbc"])
        .arg(&dbc)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    wait_until("running monitor session", || {
        let sessions = cli(&root).args(["session", "list"]).output().unwrap();
        String::from_utf8_lossy(&sessions.stdout).contains("\"running\"")
    });
    for (id, data) in [("123", "C8 00 3C"), ("124", "C8 00 3C")] {
        let sent = cli(&root)
            .args(["send", "--channel", "virtual:0", "--active"])
            .args(["--id", id, "--data", data])
            .output()
            .unwrap();
        assert!(sent.status.success());
    }
    let output = monitor.wait_with_output().unwrap();
    #[cfg(windows)]
    service.kill().unwrap();
    #[cfg(unix)]
    unsafe {
        libc::kill(service.id() as libc::pid_t, libc::SIGINT);
    }
    service.wait().unwrap();
    let _ = std::fs::remove_dir_all(&root);
    let text = String::from_utf8(output.stdout).unwrap();
    let lines: Vec<&str> = text.lines().collect();
    assert_eq!(lines.len(), 2, "{text}");
    assert!(
        lines[0].ends_with(" RX      123 [ 3] C8 00 3C  Engine: Speed=100 km/h, Temp=20 degC"),
        "{text}"
    );
    // A frame the database does not describe is printed unchanged.
    assert!(lines[1].ends_with(" RX      124 [ 3] C8 00 3C"), "{text}");
}
