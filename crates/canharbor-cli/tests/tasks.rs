// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::runtime::Runtime;
use canharbor_server::local::RunningServer;
use canharbor_virtual::VirtualBus;
use serde_json::Value;
use std::{
    path::{Path, PathBuf},
    process::{Output, Stdio},
    sync::Arc,
    time::Duration,
};
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Command,
};
fn command(root: &Path, args: &[&str]) -> Command {
    let mut c = Command::new(env!("CARGO_BIN_EXE_canharbor"));
    c.arg("--runtime-dir")
        .arg(root)
        .args(args)
        .kill_on_drop(true);
    c
}
async fn output(root: &Path, args: &[&str]) -> Output {
    tokio::time::timeout(Duration::from_secs(25), command(root, args).output())
        .await
        .unwrap()
        .unwrap()
}
async fn setup() -> (PathBuf, RunningServer) {
    let root = PathBuf::from("/tmp").join(format!("ch-task-cli-{}", uuid::Uuid::new_v4().simple()));
    let server = RunningServer::start(
        Runtime::new(Arc::new(VirtualBus::default())),
        &root,
        0,
        false,
    )
    .await
    .unwrap();
    (root, server)
}
fn json(o: &Output) -> Value {
    serde_json::from_slice(&o.stdout).unwrap_or_else(|e| {
        panic!(
            "{e}: {} / {}",
            String::from_utf8_lossy(&o.stdout),
            String::from_utf8_lossy(&o.stderr)
        )
    })
}
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn create_query_and_recover_keep_results_without_restarting_transmission() {
    let (root, server) = setup().await;
    let out = output(
        &root,
        &[
            "task",
            "create",
            "--channel",
            "virtual:0",
            "--id",
            "123",
            "--data",
            "0102",
            "--count",
            "1",
            "--interval-ms",
            "1000",
            "--active",
            "--request-id",
            "cli-once",
        ],
    )
    .await;
    assert!(
        out.status.success(),
        "{}",
        String::from_utf8_lossy(&out.stderr)
    );
    let task = json(&out);
    assert_eq!(task["submitted"], "1");
    let shown = output(&root, &["task", "show", task["id"].as_str().unwrap()]).await;
    assert_eq!(json(&shown)["id"], task["id"]);
    let found = output(
        &root,
        &[
            "task",
            "recover",
            "--session",
            task["session_id"].as_str().unwrap(),
            "--request",
            "cli-once",
            "--generation",
            task["generation"].as_str().unwrap(),
        ],
    )
    .await;
    assert_eq!(json(&found)["id"], task["id"]);
    assert!(server.state.runtime.session_snapshot().await.is_empty());
    assert!(output(&root, &["task", "list"]).await.status.success());
    assert!(server.shutdown().await.failures.is_empty());
    std::fs::remove_dir_all(root).unwrap();
}
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn another_cli_can_cancel_and_sigint_reports_the_final_task_state() {
    for signal in [false, true] {
        let (root, server) = setup().await;
        let mut child = command(
            &root,
            &[
                "task",
                "create",
                "--channel",
                "virtual:0",
                "--id",
                "123",
                "--count",
                "2",
                "--interval-ms",
                "60000",
                "--active",
            ],
        )
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
        let mut lines = BufReader::new(child.stderr.take().unwrap()).lines();
        let ready = tokio::time::timeout(Duration::from_secs(5), lines.next_line())
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        let id = ready
            .split_whitespace()
            .nth(1)
            .unwrap()
            .trim_end_matches(':')
            .to_owned();
        assert!(uuid::Uuid::parse_str(&id).is_ok(), "{ready}");
        child.stderr = Some(lines.into_inner().into_inner());
        if signal {
            assert_eq!(
                unsafe { libc::kill(child.id().unwrap() as libc::pid_t, libc::SIGINT) },
                0
            );
        } else {
            assert!(
                output(&root, &["task", "cancel", &id])
                    .await
                    .status
                    .success()
            );
        }
        let out = tokio::time::timeout(Duration::from_secs(10), child.wait_with_output())
            .await
            .unwrap()
            .unwrap();
        assert_eq!(
            out.status.code(),
            Some(6),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
        assert_eq!(json(&out)["state"], "cancelled");
        assert!(server.state.runtime.session_snapshot().await.is_empty());
        server.shutdown().await;
        std::fs::remove_dir_all(root).unwrap();
    }
}
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn foreground_task_renews_existing_control_across_lease_expiry() {
    let (root, server) = setup().await;
    let out = output(
        &root,
        &[
            "task",
            "create",
            "--channel",
            "virtual:0",
            "--id",
            "123",
            "--count",
            "2",
            "--interval-ms",
            "16000",
            "--active",
        ],
    )
    .await;
    assert!(
        out.status.success(),
        "{}",
        String::from_utf8_lossy(&out.stderr)
    );
    assert_eq!(json(&out)["submitted"], "2");
    assert!(server.state.runtime.session_snapshot().await.is_empty());
    server.shutdown().await;
    std::fs::remove_dir_all(root).unwrap();
}
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn invalid_plans_and_missing_active_opt_in_do_not_open_devices() {
    let (root, server) = setup().await;
    for args in [
        vec!["task", "create", "--channel", "virtual:0", "--id", "123"],
        vec![
            "task",
            "create",
            "--channel",
            "virtual:0",
            "--id",
            "123",
            "--active",
            "--count",
            "6000",
            "--interval-ms",
            "1000",
        ],
    ] {
        assert_eq!(output(&root, &args).await.status.code(), Some(2));
        assert!(server.state.runtime.session_snapshot().await.is_empty());
    }
    server.shutdown().await;
    std::fs::remove_dir_all(root).unwrap();
}
