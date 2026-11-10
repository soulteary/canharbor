// SPDX-License-Identifier: AGPL-3.0-or-later
use std::{
    path::{Path, PathBuf},
    process::{Child, Command, Output, Stdio},
    time::{Duration, Instant},
};
fn command(config: &Path) -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_canharbor"));
    command
        .env("CANHARBOR_CONFIG_DIR", config)
        .env("LC_ALL", "C");
    command
}
fn text(output: &Output) -> String {
    String::from_utf8_lossy(&output.stdout).into_owned()
}
#[test]
fn help_language_can_be_selected_before_or_after_subcommands() {
    let config = Path::new("/nonexistent/canharbor-locale-fixture");
    for args in [
        vec!["--lang", "zh-CN", "--help"],
        vec!["send", "--lang=zh-CN", "--help"],
        vec!["task", "create", "--lang", "zh-CN", "--help"],
        vec!["stress", "run", "--lang", "zh-CN", "--help"],
        vec!["sequence", "receive", "--lang", "zh-CN", "--help"],
        vec!["capture", "inspect", "--lang", "zh-CN", "--help"],
    ] {
        let output = command(config).args(args).output().unwrap();
        assert!(output.status.success(), "{:?}", output);
        assert!(text(&output).contains("用法："));
        assert!(text(&output).contains("--lang"));
        assert!(!text(&output).contains("Print help"));
    }
    let output = command(config)
        .args(["--lang", "en", "--help"])
        .output()
        .unwrap();
    assert!(text(&output).contains("Usage:"));
    assert!(text(&output).contains("--runtime-dir"));
    let bad = command(config)
        .args(["--lang", "zh-CN", "send", "--not-a-flag"])
        .output()
        .unwrap();
    assert_eq!(bad.status.code(), Some(2));
    assert!(bad.stdout.is_empty());
    assert!(String::from_utf8_lossy(&bad.stderr).contains("参数或请求无效"));
}
struct Service {
    child: Child,
    root: PathBuf,
}
impl Drop for Service {
    fn drop(&mut self) {
        if matches!(self.child.try_wait(), Ok(None)) {
            unsafe { libc::kill(self.child.id() as i32, libc::SIGINT) };
        }
        let _ = self.child.wait();
        let _ = std::fs::remove_dir_all(&self.root);
    }
}
#[test]
fn saved_language_is_shared_while_machine_output_and_exit_codes_are_invariant() {
    use std::os::unix::fs::PermissionsExt;
    let root = PathBuf::from("/tmp").join(format!("ch-lang-{}", uuid::Uuid::new_v4().simple()));
    let config = root.join("config");
    std::fs::create_dir_all(&config).unwrap();
    std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
    std::fs::set_permissions(&config, std::fs::Permissions::from_mode(0o700)).unwrap();
    std::fs::write(config.join("preferences.json"), r#"{"locale":"zh-CN"}"#).unwrap();
    std::fs::set_permissions(
        config.join("preferences.json"),
        std::fs::Permissions::from_mode(0o600),
    )
    .unwrap();
    let auto = command(&config).args(["--help"]).output().unwrap();
    assert!(text(&auto).contains("用法："));
    let explicit = command(&config)
        .args(["--lang", "en", "--help"])
        .output()
        .unwrap();
    assert!(text(&explicit).contains("Usage:"));
    let child = command(&config)
        .arg("--runtime-dir")
        .arg(&root)
        .args(["serve", "--no-web"])
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    let mut service = Service { child, root };
    let deadline = Instant::now() + Duration::from_secs(10);
    while !canharbor_server::local::socket_path(&service.root).exists() {
        assert!(service.child.try_wait().unwrap().is_none());
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(10));
    }
    let run = |lang: &str, args: &[&str]| {
        command(&config)
            .arg("--runtime-dir")
            .arg(&service.root)
            .args(["--lang", lang])
            .args(args)
            .output()
            .unwrap()
    };
    for args in [
        vec!["devices", "--json"],
        vec!["session", "list"],
        vec!["capabilities", "--channel", "virtual:0"],
    ] {
        let en = run("en", &args);
        let zh = run("zh-CN", &args);
        assert!(en.status.success());
        assert!(zh.status.success());
        assert_eq!(en.stdout, zh.stdout);
        serde_json::from_slice::<serde_json::Value>(&zh.stdout).unwrap();
    }
    let en = run("en", &["devices"]);
    let zh = run("zh-CN", &["devices"]);
    assert!(text(&en).contains("simulated"));
    assert!(text(&zh).contains("模拟"));
    for lang in ["en", "zh-CN"] {
        let denied = run(
            lang,
            &[
                "send",
                "--channel",
                "virtual:0",
                "--id",
                "123",
                "--data",
                "00",
            ],
        );
        assert_eq!(denied.status.code(), Some(2));
        assert!(denied.stdout.is_empty());
    }
    let sessions = run("en", &["session", "list"]);
    let value: serde_json::Value = serde_json::from_slice(&sessions.stdout).unwrap();
    assert!(value["sessions"].as_array().unwrap().is_empty());
}
