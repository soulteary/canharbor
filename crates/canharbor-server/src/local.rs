// SPDX-License-Identifier: AGPL-3.0-or-later
use crate::{AppState, router};
use canharbor_core::runtime::Runtime;
use fs2::FileExt;
use std::{
    fs::{self, File, OpenOptions},
    io,
    os::unix::fs::{FileTypeExt, MetadataExt, OpenOptionsExt, PermissionsExt},
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};
use tokio::{
    net::{TcpListener, UnixListener, UnixStream},
    sync::watch,
    task::JoinHandle,
};
pub fn current_uid() -> u32 {
    // SAFETY: geteuid has no preconditions or pointer arguments.
    unsafe { libc::geteuid() }
}
pub fn default_runtime_dir() -> PathBuf {
    std::env::temp_dir().join(format!("canharbor-{}", current_uid()))
}
pub fn socket_path(dir: &Path) -> PathBuf {
    dir.join("service.sock")
}
struct Files {
    dir: PathBuf,
    _lock: File,
}
impl Files {
    fn acquire(dir: &Path) -> io::Result<Self> {
        match fs::create_dir(dir) {
            Ok(()) => fs::set_permissions(dir, fs::Permissions::from_mode(0o700))?,
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
            Err(e) => return Err(e),
        }
        let m = fs::symlink_metadata(dir)?;
        if !m.is_dir() || m.uid() != current_uid() || m.mode() & 0o077 != 0 {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "runtime directory must be owned by this user with mode 0700",
            ));
        }
        let lock = OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .mode(0o600)
            .custom_flags(libc::O_NOFOLLOW)
            .open(dir.join("service.lock"))?;
        let lm = lock.metadata()?;
        if !lm.is_file() || lm.uid() != current_uid() || lm.mode() & 0o077 != 0 {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "unsafe lock file",
            ));
        }
        lock.try_lock_exclusive().map_err(|_| {
            io::Error::new(io::ErrorKind::AddrInUse, "CANHarbor is already running")
        })?;
        let socket = socket_path(dir);
        match fs::symlink_metadata(&socket) {
            Ok(m) => {
                if !m.file_type().is_socket() || m.uid() != current_uid() {
                    return Err(io::Error::new(
                        io::ErrorKind::PermissionDenied,
                        "refusing to remove an unknown socket path",
                    ));
                }
                fs::remove_file(socket)?
            }
            Err(e) if e.kind() == io::ErrorKind::NotFound => {}
            Err(e) => return Err(e),
        }
        Ok(Self {
            dir: dir.into(),
            _lock: lock,
        })
    }
}
impl Drop for Files {
    fn drop(&mut self) {
        let _ = fs::remove_file(socket_path(&self.dir));
    }
}
struct SameUser(UnixListener);
impl axum::serve::Listener for SameUser {
    type Io = UnixStream;
    type Addr = tokio::net::unix::SocketAddr;
    async fn accept(&mut self) -> (Self::Io, Self::Addr) {
        loop {
            match self.0.accept().await {
                Ok((stream, addr))
                    if stream.peer_cred().is_ok_and(|c| c.uid() == current_uid()) =>
                {
                    return (stream, addr);
                }
                Ok(_) => {}
                Err(_) => tokio::time::sleep(Duration::from_millis(50)).await,
            }
        }
    }
    fn local_addr(&self) -> io::Result<Self::Addr> {
        self.0.local_addr()
    }
}
#[derive(Debug, Clone, Default)]
pub struct ServiceCloseSummary {
    pub unknown_transmissions: u64,
    /// Tasks with an uncertain terminal result during this service lifetime,
    /// plus tasks still pending after the shutdown accounting deadline.
    /// Counted separately from backend transmission records.
    pub unknown_tasks: u64,
    pub failures: Vec<String>,
}
pub struct RunningServer {
    pub state: Arc<AppState>,
    stop: watch::Sender<bool>,
    tasks: Vec<JoinHandle<()>>,
    _files: Files,
}
impl RunningServer {
    pub async fn start(
        runtime: Arc<Runtime>,
        dir: &Path,
        port: u16,
        web: bool,
    ) -> io::Result<Self> {
        if web && !cfg!(feature = "web-ui") {
            return Err(io::Error::other(
                "build with --features web-ui after building web/, or use serve --no-web",
            ));
        }
        let files = Files::acquire(dir)?;
        let uds = UnixListener::bind(socket_path(dir))?;
        fs::set_permissions(socket_path(dir), fs::Permissions::from_mode(0o600))?;
        let tcp = if web {
            Some(TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port)).await?)
        } else {
            None
        };
        let origin = match &tcp {
            Some(listener) => format!("http://{}", listener.local_addr()?),
            None => "http://127.0.0.1:0".into(),
        };
        let state = AppState::with_capture_dir(runtime, origin, web, Some(dir.join("captures")));
        let (stop, rx) = watch::channel(false);
        let mut tasks = Vec::new();
        let mut uds_stop = rx.clone();
        let app = router(state.clone(), true);
        tasks.push(tokio::spawn(async move {
            if let Err(e) = axum::serve(SameUser(uds), app)
                .with_graceful_shutdown(async move {
                    let _ = uds_stop.changed().await;
                })
                .await
            {
                eprintln!("UDS server stopped: {e}")
            }
        }));
        if let Some(tcp) = tcp {
            let app = router(state.clone(), false);
            let mut tcp_stop = rx.clone();
            tasks.push(tokio::spawn(async move {
                if let Err(e) = axum::serve(tcp, app)
                    .with_graceful_shutdown(async move {
                        let _ = tcp_stop.changed().await;
                    })
                    .await
                {
                    eprintln!("HTTP server stopped: {e}")
                }
            }));
        }
        let r = state.runtime.clone();
        let mut maintenance_stop = rx;
        tasks.push(tokio::spawn(async move{let mut interval=tokio::time::interval(Duration::from_millis(100));loop{tokio::select!{_=interval.tick()=>r.maintain().await,_=maintenance_stop.changed()=>break}}}));
        Ok(Self {
            state,
            stop,
            tasks,
            _files: files,
        })
    }
    pub async fn shutdown(mut self) -> ServiceCloseSummary {
        self.state.stress.stop_all();
        self.state.periodic.begin_shutdown();
        self.state.runtime.fence_shutdown();
        let _ = self.stop.send(true);
        // Start owned backend cleanup before the first await. Dropping this
        // service shutdown waiter must not strand runtime teardown behind task
        // accounting, which can legitimately wait for an in-flight submission.
        let runtime = self.state.runtime.clone();
        let backend = tokio::spawn(async move { runtime.shutdown().await });
        let unknown_tasks =
            self.state.periodic.shutdown().await + self.state.stress.shutdown().await;
        let backend = backend
            .await
            .unwrap_or_else(|error| canharbor_core::CloseSummary {
                unknown_transmissions: 0,
                failures: vec![format!("runtime shutdown accounting failed: {error}")],
            });
        let mut summary = ServiceCloseSummary {
            unknown_tasks,
            unknown_transmissions: backend.unknown_transmissions,
            failures: backend.failures,
        };
        summary
            .failures
            .extend(self.state.captures.shutdown().await);
        for mut task in self.tasks.drain(..) {
            if tokio::time::timeout(Duration::from_secs(3), &mut task)
                .await
                .is_err()
            {
                task.abort();
                let _ = task.await;
            }
        }
        summary
    }
}
impl Drop for RunningServer {
    fn drop(&mut self) {
        self.state.stress.stop_all();
        self.state.periodic.begin_shutdown();
        self.state.runtime.fence_shutdown();
        let _ = self.stop.send(true);
        for task in &self.tasks {
            task.abort();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_symlink_and_foreign_socket_paths() {
        let base =
            std::env::temp_dir().join(format!("ch-local-test-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir(&base).unwrap();
        fs::set_permissions(&base, fs::Permissions::from_mode(0o700)).unwrap();
        let real = base.join("real");
        fs::create_dir(&real).unwrap();
        fs::set_permissions(&real, fs::Permissions::from_mode(0o700)).unwrap();
        std::os::unix::fs::symlink(&real, base.join("link")).unwrap();
        assert!(Files::acquire(&base.join("link")).is_err());
        fs::write(socket_path(&real), b"do not remove").unwrap();
        assert!(Files::acquire(&real).is_err());
        assert_eq!(fs::read(socket_path(&real)).unwrap(), b"do not remove");
        fs::remove_dir_all(&base).unwrap();
    }
}
