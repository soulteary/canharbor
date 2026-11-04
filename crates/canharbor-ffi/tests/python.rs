// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::runtime::Runtime;
use canharbor_server::local::RunningServer;
use canharbor_virtual::VirtualBus;
use std::{path::PathBuf, sync::Arc};
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn python_wrapper_runs_control_against_the_compiled_c_abi() {
    assert_eq!(canharbor_ffi::canharbor_abi_version(), 1);
    let root = PathBuf::from("/tmp").join(format!("ch-py-{}", uuid::Uuid::new_v4().simple()));
    let server = RunningServer::start(
        Runtime::new(Arc::new(VirtualBus::default())),
        &root,
        0,
        false,
    )
    .await
    .unwrap();
    let repository = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let deps = std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf();
    let library = deps.join(if cfg!(target_os = "macos") {
        "libcanharbor_ffi.dylib"
    } else {
        "libcanharbor_ffi.so"
    });
    let python = std::env::var_os("CANHARBOR_TEST_PYTHON").unwrap_or_else(|| "python3".into());
    for script in ["tests/integration.py", "examples/discover.py"] {
        let result = std::process::Command::new(&python)
            .arg(repository.join("python").join(script))
            .arg(&root)
            .arg(&library)
            .env("PYTHONPATH", repository.join("python/src"))
            .output()
            .unwrap();
        assert!(
            result.status.success(),
            "{}",
            String::from_utf8_lossy(&result.stderr)
        );
        assert!(!result.stdout.is_empty());
    }
    assert!(server.shutdown().await.failures.is_empty());
    let _ = std::fs::remove_dir_all(root);
}
