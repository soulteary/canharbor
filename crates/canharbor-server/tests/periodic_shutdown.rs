// SPDX-License-Identifier: AGPL-3.0-or-later
use axum::{body::Body, http::Request};
use canharbor_core::{
    Backend, BackendEvent, BackendFuture, Capabilities, Channel, Config, Error, Frame,
    control::Permit,
    runtime::{Mode, Runtime},
};
use canharbor_server::{AppState, local::RunningServer, router};
use canharbor_virtual::VirtualBus;
use http_body_util::BodyExt;
use serde_json::{Value, json};
use std::{path::PathBuf, sync::Arc, time::Duration};
use tokio::sync::{Notify, broadcast};
use tower::ServiceExt;
struct Queued {
    bus: VirtualBus,
    entered: Notify,
    release: Notify,
}
impl Queued {
    fn new() -> Self {
        Self {
            bus: VirtualBus::default(),
            entered: Notify::new(),
            release: Notify::new(),
        }
    }
}
impl Backend for Queued {
    fn capabilities(&self, c: &str) -> Result<Capabilities, Error> {
        self.bus.capabilities(c)
    }
    fn channels(&self) -> Vec<Channel> {
        self.bus.channels()
    }
    fn subscribe(&self, c: &str) -> Result<broadcast::Receiver<Arc<BackendEvent>>, Error> {
        self.bus.subscribe(c)
    }
    fn check_channel(&self, c: &str) -> Result<u64, Error> {
        self.bus.check_channel(c)
    }
    fn transmit(&self, c: &str, f: Frame) -> Result<(), Error> {
        self.bus.transmit(c, f)
    }
    fn configure<'a>(&'a self, c: &'a str, v: Config) -> BackendFuture<'a, ()> {
        self.bus.configure(c, v)
    }
    fn start<'a>(&'a self, c: &'a str, p: Permit) -> BackendFuture<'a, ()> {
        self.bus.start(c, p)
    }
    fn stop<'a>(&'a self, c: &'a str) -> BackendFuture<'a, ()> {
        self.bus.stop(c)
    }
    fn close<'a>(&'a self, c: &'a str) -> BackendFuture<'a, ()> {
        self.bus.close(c)
    }
    fn submit<'a>(&'a self, c: &'a str, f: Frame, p: Permit) -> BackendFuture<'a, ()> {
        Box::pin(async move {
            self.entered.notify_one();
            self.release.notified().await;
            p.check()?;
            self.bus.submit(c, f, p).await
        })
    }
}
const CLIENT: &str = "11111111-1111-4111-8111-111111111111";
async fn request(
    state: &Arc<AppState>,
    method: &str,
    path: &str,
    body: Value,
    g: Option<u64>,
) -> Value {
    let mut request = Request::builder()
        .method(method)
        .uri(path)
        .header("host", state.origin.strip_prefix("http://").unwrap())
        .header("content-type", "application/json")
        .header("x-canharbor-client", CLIENT);
    if let Some(g) = g {
        request = request.header("x-canharbor-lease-generation", g.to_string());
    }
    let response = router(state.clone(), true)
        .oneshot(request.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    assert!(response.status().is_success());
    serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes()).unwrap()
}
async fn service() -> (RunningServer, Arc<Queued>, PathBuf, String, u64) {
    let backend = Arc::new(Queued::new());
    let runtime = Runtime::new(backend.clone());
    let s = runtime.create("virtual:0", Mode::Active).await.unwrap();
    let a = runtime
        .acquire(&s.id, &format!("native:{CLIENT}"))
        .await
        .unwrap();
    runtime
        .running(&s.id, &format!("native:{CLIENT}"), a.generation, true)
        .await
        .unwrap();
    let root =
        PathBuf::from("/tmp").join(format!("ch-task-close-{}", uuid::Uuid::new_v4().simple()));
    let server = RunningServer::start(runtime, &root, 0, false)
        .await
        .unwrap();
    (server, backend, root, s.id, a.generation)
}
async fn start(state: &Arc<AppState>, session: &str, g: u64) -> String {
    request(state,"POST",&format!("/api/v1/sessions/{session}/tasks"),json!({"client_request_id":"shutdown-task","frame":{"kind":"classic_data","id":291,"data_hex":"00"},"interval_ms":10,"count":3}),Some(g)).await["id"].as_str().unwrap().to_owned()
}
#[tokio::test]
async fn shutdown_reports_unknown_tasks_separately_from_backend_pending_frames() {
    let (server, backend, root, session, g) = service().await;
    let state = server.state.clone();
    let mut traffic = backend.bus.subscribe("virtual:0").unwrap();
    let id = start(&state, &session, g).await;
    backend.entered.notified().await;
    let report = tokio::time::timeout(Duration::from_secs(4), server.shutdown())
        .await
        .unwrap();
    assert_eq!(report.unknown_tasks, 1);
    assert_eq!(report.unknown_transmissions, 0);
    assert!(report.failures.is_empty());
    let result = request(
        &state,
        "GET",
        &format!("/api/v1/tasks/{id}"),
        Value::Null,
        None,
    )
    .await;
    assert_eq!(result["state"], "outcome_unknown");
    assert_eq!(result["attempted"], "1");
    backend.release.notify_one();
    tokio::task::yield_now().await;
    assert!(traffic.try_recv().is_err());
    std::fs::remove_dir_all(root).unwrap();
}
#[tokio::test]
async fn dropping_a_service_fences_queued_task_io_before_async_cleanup() {
    let (server, backend, root, session, g) = service().await;
    let state = server.state.clone();
    let mut traffic = backend.bus.subscribe("virtual:0").unwrap();
    let id = start(&state, &session, g).await;
    backend.entered.notified().await;
    drop(server);
    backend.release.notify_one();
    let until = tokio::time::Instant::now() + Duration::from_secs(2);
    loop {
        let result = request(
            &state,
            "GET",
            &format!("/api/v1/tasks/{id}"),
            Value::Null,
            None,
        )
        .await;
        if !matches!(
            result["state"].as_str().unwrap(),
            "starting" | "running" | "cancelling"
        ) {
            assert_eq!(result["submitted"], "0");
            break;
        }
        assert!(tokio::time::Instant::now() < until);
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    assert!(traffic.try_recv().is_err());
    state.runtime.shutdown().await;
    std::fs::remove_dir_all(root).unwrap();
}
