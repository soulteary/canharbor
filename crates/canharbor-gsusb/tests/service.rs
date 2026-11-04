// SPDX-License-Identifier: AGPL-3.0-or-later
mod common;
use axum::{Router, body::Body, http::Request};
use canharbor_core::{Backend, registry::Registry, runtime::Runtime};
use canharbor_gsusb::backend::GsUsbBackend;
use canharbor_server::{AppState, router};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use std::{sync::Arc, time::Duration};
use tower::ServiceExt;
async fn call(
    app: &Router,
    method: &str,
    path: &str,
    body: Value,
    lease: Option<&str>,
) -> (u16, Value) {
    let mut request = Request::builder()
        .method(method)
        .uri(format!("/api/v1{path}"))
        .header("host", "127.0.0.1:32180")
        .header("content-type", "application/json")
        .header("x-canharbor-client", "00000000-0000-4000-8000-000000000001");
    if let Some(lease) = lease {
        request = request.header("x-canharbor-lease-generation", lease);
    }
    let response = app
        .clone()
        .oneshot(request.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    let status = response.status().as_u16();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(Value::Null),
    )
}
#[tokio::test]
async fn fake_usb_runs_through_authenticated_service_without_simulation_claims() {
    let fake = common::Fake::default();
    let backend = Arc::new(
        GsUsbBackend::open(fake.clone(), 0, "service-test".into())
            .await
            .unwrap(),
    );
    let channel = backend.channels()[0].id.clone();
    let runtime = Runtime::new(Arc::new(Registry::new(vec![backend]).unwrap()));
    let app = router(
        AppState::new(runtime.clone(), "http://127.0.0.1:32180".into()),
        true,
    );
    let (status, devices) = call(&app, "GET", "/devices", Value::Null, None).await;
    assert_eq!(status, 200);
    assert_eq!(devices["devices"][0]["backend"], "gs_usb");
    assert_eq!(devices["devices"][0]["simulated"], false);
    assert_eq!(devices["devices"][0]["verification"], "hardware_unverified");
    let (status, session) = call(
        &app,
        "POST",
        "/sessions",
        json!({"channel_id":channel,"config":{"mode":"active","nominal_bitrate":500000}}),
        None,
    )
    .await;
    assert_eq!(status, 201);
    let id = session["id"].as_str().unwrap();
    let (status, lease) = call(
        &app,
        "POST",
        &format!("/sessions/{id}/lease"),
        json!({}),
        None,
    )
    .await;
    assert_eq!(status, 200);
    let generation = lease["generation"].as_str().unwrap();
    let (status, _) = call(
        &app,
        "POST",
        &format!("/sessions/{id}/start"),
        json!({}),
        Some(generation),
    )
    .await;
    assert_eq!(status, 200);
    let mut rx = runtime.subscribe(id).await.unwrap();
    let (status,receipt)=call(&app,"POST",&format!("/sessions/{id}/tx"),json!({"client_request_id":"one","frame":{"kind":"classic_data","id":291,"data_hex":"0102"}}),Some(generation)).await;
    assert_eq!(status, 202);
    assert_eq!(receipt["simulated"], false);
    assert_eq!(receipt["confirmation"], "backend_submitted");
    assert_eq!(
        tokio::time::timeout(Duration::from_secs(2), rx.recv())
            .await
            .unwrap()
            .unwrap()
            .direction,
        "tx"
    );
    assert_eq!(fake.0.lock().unwrap().writes, 1);
    let (status, _) = call(
        &app,
        "DELETE",
        &format!("/sessions/{id}"),
        json!({}),
        Some(generation),
    )
    .await;
    assert_eq!(status, 204);
    runtime.shutdown().await;
    assert_eq!(fake.0.lock().unwrap().cancels, 1);
}
