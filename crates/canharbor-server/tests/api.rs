// SPDX-License-Identifier: AGPL-3.0-or-later
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
};
use canharbor_core::runtime::Runtime;
use canharbor_server::{AppState, router};
use canharbor_virtual::VirtualBus;
use http_body_util::BodyExt;
use serde_json::{Value, json};
use std::sync::Arc;
use tower::ServiceExt;
fn state() -> Arc<AppState> {
    AppState::new(
        Runtime::new(Arc::new(VirtualBus::default())),
        "http://127.0.0.1:32180".into(),
    )
}
async fn call(
    app: Router,
    method: &str,
    path: &str,
    body: Value,
    headers: &[(&str, &str)],
) -> (StatusCode, axum::http::HeaderMap, Value) {
    let mut b = Request::builder()
        .method(method)
        .uri(path)
        .header("host", "127.0.0.1:32180")
        .header("content-type", "application/json");
    for (k, v) in headers {
        b = b.header(*k, *v);
    }
    let res = app
        .oneshot(b.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    let (status, h) = (res.status(), res.headers().clone());
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, h, value)
}
#[tokio::test]
async fn browser_pairing_origin_csrf_and_logout() {
    let s = state();
    let native = router(s.clone(), true);
    let web = router(s, false);
    let client = uuid::Uuid::new_v4().to_string();
    let (_, _, v) = call(
        native,
        "POST",
        "/api/v1/native/pair",
        json!({}),
        &[("x-canharbor-client", &client)],
    )
    .await;
    let code = v["url"].as_str().unwrap().split("#pair=").nth(1).unwrap();
    let (status, _, _) = call(web.clone(), "GET", "/api/v1/devices", Value::Null, &[]).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = call(
        web.clone(),
        "POST",
        "/api/v1/auth/pair",
        json!({"code":code}),
        &[("origin", "https://attacker.test")],
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, h, v) = call(
        web.clone(),
        "POST",
        "/api/v1/auth/pair",
        json!({"code":code}),
        &[("origin", "http://127.0.0.1:32180")],
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let cookie = h["set-cookie"].to_str().unwrap().split(';').next().unwrap();
    let csrf = v["csrf_token"].as_str().unwrap();
    let (status, _, _) = call(
        web.clone(),
        "POST",
        "/api/v1/auth/pair",
        json!({"code":code}),
        &[("origin", "http://127.0.0.1:32180")],
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let headers = [("cookie", cookie), ("origin", "http://127.0.0.1:32180")];
    let (status, _, _) = call(web.clone(), "GET", "/api/v1/devices", Value::Null, &headers).await;
    assert_eq!(status, StatusCode::OK);
    let body =
        json!({"channel_id":"virtual:0","config":{"mode":"listen_only","nominal_bitrate":500000}});
    let (status, _, _) = call(
        web.clone(),
        "POST",
        "/api/v1/sessions",
        body.clone(),
        &headers,
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let good = [
        ("cookie", cookie),
        ("origin", "http://127.0.0.1:32180"),
        ("x-canharbor-csrf", csrf),
    ];
    let (status, _, _) = call(web.clone(), "POST", "/api/v1/sessions", body, &good).await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, _) = call(web.clone(), "POST", "/api/v1/native/pair", json!({}), &good).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, _, _) = call(
        web.clone(),
        "DELETE",
        "/api/v1/auth/session",
        json!({}),
        &good,
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = call(web, "GET", "/api/v1/devices", Value::Null, &headers).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}
#[tokio::test]
async fn native_control_and_idempotent_transmission() {
    let app = router(state(), true);
    let client = uuid::Uuid::new_v4().to_string();
    let h = [("x-canharbor-client", client.as_str())];
    let (_, _, v) = call(
        app.clone(),
        "POST",
        "/api/v1/sessions",
        json!({"channel_id":"virtual:0","config":{"mode":"active","nominal_bitrate":500000}}),
        &h,
    )
    .await;
    let id = v["id"].as_str().unwrap();
    let (_, _, lease) = call(
        app.clone(),
        "POST",
        &format!("/api/v1/sessions/{id}/lease"),
        json!({}),
        &h,
    )
    .await;
    let g = lease["generation"].as_str().unwrap();
    let control = [
        ("x-canharbor-client", client.as_str()),
        ("x-canharbor-lease-generation", g),
    ];
    let other = uuid::Uuid::new_v4().to_string();
    let (status, _, _) = call(
        app.clone(),
        "POST",
        &format!("/api/v1/sessions/{id}/start"),
        json!({}),
        &[
            ("x-canharbor-client", &other),
            ("x-canharbor-lease-generation", g),
        ],
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT);
    let (status, _, _) = call(
        app.clone(),
        "POST",
        &format!("/api/v1/sessions/{id}/start"),
        json!({}),
        &control,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let tx = json!({"client_request_id":"once","frame":{"kind":"fd_data","id":291,"extended":false,"brs":true,"data_hex":"0102030405060708090A0B0C"}});
    let (status, _, first) = call(
        app.clone(),
        "POST",
        &format!("/api/v1/sessions/{id}/tx"),
        tx.clone(),
        &control,
    )
    .await;
    assert_eq!(status, StatusCode::ACCEPTED);
    let (_, _, second) = call(
        app.clone(),
        "POST",
        &format!("/api/v1/sessions/{id}/tx"),
        tx.clone(),
        &control,
    )
    .await;
    assert_eq!(first, second);
    let mut changed = tx;
    changed["frame"]["data_hex"] = json!("00");
    let (status, _, _) = call(
        app.clone(),
        "POST",
        &format!("/api/v1/sessions/{id}/tx"),
        changed,
        &control,
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT);
    let invalid = json!({"client_request_id":"bad","frame":{"kind":"fd_data","id":291,"data_hex":"000000000000000000"}});
    let (status, _, _) = call(
        app,
        "POST",
        &format!("/api/v1/sessions/{id}/tx"),
        invalid,
        &control,
    )
    .await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
}
#[tokio::test]
async fn host_and_native_header_do_not_bypass_browser_boundary() {
    let app = router(state(), false);
    let req = Request::builder()
        .uri("/api/v1/version")
        .header("host", "attacker.test")
        .body(Body::empty())
        .unwrap();
    assert_eq!(
        app.clone().oneshot(req).await.unwrap().status(),
        StatusCode::FORBIDDEN
    );
    let client = uuid::Uuid::new_v4().to_string();
    let (status, _, _) = call(
        app,
        "GET",
        "/api/v1/devices",
        Value::Null,
        &[("x-canharbor-client", &client)],
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test(start_paused = true)]
async fn pairing_code_expires_and_headless_service_does_not_issue_links() {
    let s = state();
    let native = router(s.clone(), true);
    let web = router(s, false);
    let client = uuid::Uuid::new_v4().to_string();
    let (_, _, v) = call(
        native,
        "POST",
        "/api/v1/native/pair",
        json!({}),
        &[("x-canharbor-client", &client)],
    )
    .await;
    let code = v["url"].as_str().unwrap().split("#pair=").nth(1).unwrap();
    tokio::time::advance(std::time::Duration::from_secs(61)).await;
    let (status, _, _) = call(
        web,
        "POST",
        "/api/v1/auth/pair",
        json!({"code":code}),
        &[("origin", "http://127.0.0.1:32180")],
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let headless = AppState::with_web(
        Runtime::new(Arc::new(VirtualBus::default())),
        "http://127.0.0.1:0".into(),
        false,
    );
    let (status, _, _) = call(
        router(headless, true),
        "POST",
        "/api/v1/native/pair",
        json!({}),
        &[("x-canharbor-client", &client)],
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT);
}
