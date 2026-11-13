// SPDX-License-Identifier: AGPL-3.0-or-later
use std::{
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    time::{Duration, Instant},
};
struct Service {
    child: Child,
    root: PathBuf,
}
impl Drop for Service {
    fn drop(&mut self) {
        if matches!(self.child.try_wait(), Ok(None)) {
            #[cfg(windows)]
            let _ = self.child.kill();
            #[cfg(unix)]
            unsafe {
                libc::kill(self.child.id() as libc::pid_t, libc::SIGINT)
            };
        }
        let _ = self.child.wait();
        let _ = std::fs::remove_dir_all(&self.root);
    }
}
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
fn text_output_shows_only_the_selected_identifiers() {
    let root = test_temp_dir().join(format!("ch-monitor-{}", uuid::Uuid::new_v4().simple()));
    let child = cli(&root)
        .args(["serve", "--no-web"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let service = Service { child, root };
    wait_until("service", || {
        cli(&service.root)
            .arg("devices")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok_and(|s| s.success())
    });
    let monitor = cli(&service.root)
        .args([
            "monitor",
            "--channel",
            "virtual:1",
            "--listen-only",
            "--count",
            "2",
            "--id",
            "0x321",
            "--id",
            "7FF",
            "--format",
            "text",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    wait_until("running monitor session", || {
        let sessions = cli(&service.root)
            .args(["session", "list"])
            .output()
            .unwrap();
        String::from_utf8_lossy(&sessions.stdout).contains("\"running\"")
    });
    // The third frame uses cansend notation instead of --id and --data.
    for frame in [
        vec!["--id", "100", "--data", "00"],
        vec!["--id", "0x321", "--data", "AA bb"],
        vec!["--frame", "7FF#"],
    ] {
        let sent = cli(&service.root)
            .args(["send", "--channel", "virtual:0", "--active"])
            .args(frame)
            .output()
            .unwrap();
        assert!(
            sent.status.success(),
            "{}",
            String::from_utf8_lossy(&sent.stderr)
        );
    }
    let output = monitor.wait_with_output().unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let text = String::from_utf8(output.stdout).unwrap();
    let lines: Vec<&str> = text.lines().collect();
    assert_eq!(lines.len(), 2, "{text}");
    assert!(lines[0].ends_with(" RX      321 [ 2] AA BB"), "{text}");
    assert!(lines[1].ends_with(" RX      7FF [ 0]"), "{text}");

    for conflicting in [
        vec!["--frame", "123#00", "--id", "123"],
        vec!["--frame", "123#00", "--extended"],
        vec!["--frame", "1234#00"],
        vec![],
    ] {
        let refused = cli(&service.root)
            .args(["send", "--channel", "virtual:0", "--active"])
            .args(conflicting)
            .output()
            .unwrap();
        assert_eq!(refused.status.code(), Some(2));
    }
    let rejected = cli(&service.root)
        .args(["monitor", "--session", "s", "--format", "csv"])
        .output()
        .unwrap();
    assert_eq!(rejected.status.code(), Some(2));
}

fn test_temp_dir() -> std::path::PathBuf {
    if cfg!(windows) {
        std::env::temp_dir()
    } else {
        std::path::PathBuf::from("/tmp")
    }
}
