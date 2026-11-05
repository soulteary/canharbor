// SPDX-License-Identifier: AGPL-3.0-or-later
mod common;
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
};
use canharbor_core::runtime::{Mode, Runtime};
use canharbor_server::{AppState, router};
use canharbor_virtual::VirtualBus;
use http_body_util::BodyExt;
use serde_json::{Value, json};
use std::{sync::Arc, time::Duration};
use tower::ServiceExt;
const OWNER: &str = "11111111-1111-4111-8111-111111111111";
async fn call(
    app: &Router,
    method: &str,
    path: &str,
    body: Value,
    owner: &str,
    g: Option<u64>,
) -> (StatusCode, Value) {
    let mut request = Request::builder()
        .method(method)
        .uri(path)
        .header("host", "127.0.0.1:32180")
        .header("content-type", "application/json")
        .header("x-canharbor-client", owner);
    if let Some(g) = g {
        request = request.header("x-canharbor-lease-generation", g.to_string());
    }
    let response = app
        .clone()
        .oneshot(request.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let value: Value = serde_json::from_slice(&bytes).unwrap();
    let schema = if !status.is_success() {
        "ApiErrorBody"
    } else if path == "/api/v1/tasks" {
        "PeriodicTasks"
    } else if path.ends_with("/tx") {
        "TxReceipt"
    } else {
        "PeriodicTask"
    };
    common::validate(schema, &value);
    (status, value)
}
async fn setup() -> (Arc<Runtime>, Router, String, u64) {
    let runtime = Runtime::new(Arc::new(VirtualBus::default()));
    let s = runtime.create("virtual:0", Mode::Active).await.unwrap();
    let a = runtime
        .acquire(&s.id, &format!("native:{OWNER}"))
        .await
        .unwrap();
    runtime
        .running(&s.id, &format!("native:{OWNER}"), a.generation, true)
        .await
        .unwrap();
    let app = router(
        AppState::new(runtime.clone(), "http://127.0.0.1:32180".into()),
        true,
    );
    (runtime, app, s.id, a.generation)
}
fn plan(request: &str, count: u32, interval: u32) -> Value {
    json!({"client_request_id":request,"frame":{"kind":"classic_data","id":291,"data_hex":"aabb"},"count":count,"interval_ms":interval})
}
async fn done(app: &Router, id: &str) -> Value {
    for _ in 0..100 {
        let (_, value) = call(
            app,
            "GET",
            &format!("/api/v1/tasks/{id}"),
            Value::Null,
            OWNER,
            None,
        )
        .await;
        if !matches!(
            value["state"].as_str().unwrap(),
            "starting" | "running" | "cancelling"
        ) {
            return value;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    panic!("task did not complete")
}
#[tokio::test(start_paused = true)]
async fn periodic_routes_are_typed_idempotent_and_recoverable_by_another_native_reader() {
    let (runtime, app, s, g) = setup().await;
    let path = format!("/api/v1/sessions/{s}/tasks");
    let request = plan("one", 3, 10);
    let (status, first) = call(&app, "POST", &path, request.clone(), OWNER, Some(g)).await;
    assert_eq!(status, 202);
    let id = first["id"].as_str().unwrap();
    let (_, second) = call(&app, "POST", &path, request, OWNER, Some(g)).await;
    assert_eq!(second["id"], first["id"]);
    let mut changed = plan("one", 3, 10);
    changed["frame"]["id"] = 292.into();
    assert_eq!(
        call(&app, "POST", &path, changed, OWNER, Some(g)).await.0,
        409
    );
    let result = done(&app, id).await;
    assert_eq!(result["state"], "completed");
    assert_eq!(result["submitted"], "3");
    let other = "22222222-2222-4222-8222-222222222222";
    assert_eq!(
        call(
            &app,
            "GET",
            &format!("/api/v1/tasks/{id}"),
            Value::Null,
            other,
            None
        )
        .await
        .1["id"],
        first["id"]
    );
    assert_eq!(
        call(&app, "GET", "/api/v1/tasks", Value::Null, other, None)
            .await
            .1["tasks"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    runtime.shutdown().await;
}
#[tokio::test(start_paused = true)]
async fn invalid_plans_do_not_reserve_tasks_and_active_owner_limits_apply() {
    let (runtime, app, s, g) = setup().await;
    let path = format!("/api/v1/sessions/{s}/tasks");
    for body in [
        plan("bad", 0, 10),
        plan("bad", 1, 9),
        plan("bad", 8, 10000),
        plan(&"🚀".repeat(129), 1, 10),
    ] {
        assert_eq!(call(&app, "POST", &path, body, OWNER, Some(g)).await.0, 422);
    }
    assert!(
        call(&app, "GET", "/api/v1/tasks", Value::Null, OWNER, None)
            .await
            .1["tasks"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    let mut ids = vec![];
    for i in 0..4 {
        let (status, value) = call(
            &app,
            "POST",
            &path,
            plan(&format!("active-{i}"), 2, 60000),
            OWNER,
            Some(g),
        )
        .await;
        assert_eq!(status, 202);
        ids.push(value["id"].as_str().unwrap().to_owned());
    }
    assert_eq!(
        call(&app, "POST", &path, plan("fifth", 2, 60000), OWNER, Some(g))
            .await
            .0,
        429
    );
    for id in &ids {
        assert_eq!(
            call(
                &app,
                "POST",
                &format!("/api/v1/tasks/{id}/cancel"),
                json!({}),
                "22222222-2222-4222-8222-222222222222",
                None
            )
            .await
            .0,
            200
        );
    }
    for id in &ids {
        assert_eq!(done(&app, id).await["state"], "cancelled");
    }
    tokio::time::advance(Duration::from_secs(301)).await;
    assert_eq!(
        call(
            &app,
            "GET",
            &format!("/api/v1/tasks/{}", ids[0]),
            Value::Null,
            OWNER,
            None
        )
        .await
        .0,
        404
    );
    runtime.shutdown().await;
}
#[tokio::test(start_paused = true)]
async fn manual_and_periodic_submissions_share_one_owner_credit_bucket() {
    let (runtime, app, s, g) = setup().await;
    for i in 0..20 {
        let tx = json!({"client_request_id":format!("manual-{i}"),"frame":{"kind":"classic_data","id":1,"data_hex":"00"}});
        assert_eq!(
            call(
                &app,
                "POST",
                &format!("/api/v1/sessions/{s}/tx"),
                tx,
                OWNER,
                Some(g)
            )
            .await
            .0,
            202
        );
    }
    let (status, value) = call(
        &app,
        "POST",
        &format!("/api/v1/sessions/{s}/tasks"),
        plan("no-credit", 1, 10),
        OWNER,
        Some(g),
    )
    .await;
    assert_eq!(status, 202);
    let result = done(&app, value["id"].as_str().unwrap()).await;
    assert_eq!(result["state"], "failed");
    assert_eq!(result["attempted"], "0");
    assert!(
        result["reason"]
            .as_str()
            .unwrap()
            .contains("rate exhausted")
    );
    runtime.shutdown().await;
}

#[tokio::test(start_paused = true)]
async fn concurrent_equivalent_requests_share_one_task_even_after_control_is_released() {
    let (runtime, app, s, g) = setup().await;
    let mut traffic = runtime.subscribe(&s).await.unwrap();
    let path = format!("/api/v1/sessions/{s}/tasks");
    let first = plan("concurrent", 3, 10);
    let mut equivalent = first.clone();
    equivalent["frame"]["data_hex"] = "AABB".into();
    let (a, b) = tokio::join!(
        call(&app, "POST", &path, first.clone(), OWNER, Some(g)),
        call(&app, "POST", &path, equivalent, OWNER, Some(g))
    );
    assert_eq!(a.0, 202);
    assert_eq!(b.0, 202);
    assert_eq!(a.1["id"], b.1["id"]);
    let id = a.1["id"].as_str().unwrap();
    assert_eq!(done(&app, id).await["submitted"], "3");
    runtime
        .release(&s, &format!("native:{OWNER}"), g)
        .await
        .unwrap();
    let replay = call(&app, "POST", &path, first, OWNER, Some(g)).await;
    assert_eq!(replay.0, 202);
    assert_eq!(replay.1["id"], a.1["id"]);
    let mut count = 0;
    while traffic.try_recv().is_ok() {
        count += 1;
    }
    assert_eq!(
        count, 3,
        "replaying a retained request must not submit another frame"
    );
    runtime.shutdown().await;
}
#[tokio::test(start_paused = true)]
async fn dropped_start_response_is_recovered_by_read_only_native_listing() {
    let (runtime, app, s, g) = setup().await;
    let request = Request::builder()
        .method("POST")
        .uri(format!("/api/v1/sessions/{s}/tasks"))
        .header("host", "127.0.0.1:32180")
        .header("content-type", "application/json")
        .header("x-canharbor-client", OWNER)
        .header("x-canharbor-lease-generation", g.to_string())
        .body(Body::from(plan("lost-response", 3, 10).to_string()))
        .unwrap();
    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), 202);
    drop(response); // Do not read or replay the start response.
    let (_, listed) = call(
        &app,
        "GET",
        "/api/v1/tasks",
        Value::Null,
        "22222222-2222-4222-8222-222222222222",
        None,
    )
    .await;
    let tasks = listed["tasks"].as_array().unwrap();
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0]["client_request_id"], "lost-response");
    assert_eq!(
        done(&app, tasks[0]["id"].as_str().unwrap()).await["submitted"],
        "3"
    );
    runtime.shutdown().await;
}

#[tokio::test(start_paused = true)]
async fn retained_results_are_not_evicted_to_admit_new_tasks() {
    let (runtime, app, session, generation) = setup().await;
    let path = format!("/api/v1/sessions/{session}/tasks");
    let mut first_id = None;
    for index in 0..128 {
        tokio::time::advance(Duration::from_millis(10)).await;
        let (status, value) = call(
            &app,
            "POST",
            &path,
            plan(&format!("retained-{index}"), 1, 10),
            OWNER,
            Some(generation),
        )
        .await;
        assert_eq!(status, 202, "{value}");
        let id = value["id"].as_str().unwrap();
        if first_id.is_none() {
            first_id = Some(id.to_owned());
        }
        assert_eq!(done(&app, id).await["state"], "completed");
    }
    assert_eq!(
        call(
            &app,
            "POST",
            &path,
            plan("full", 1, 10),
            OWNER,
            Some(generation)
        )
        .await
        .0,
        429
    );
    let replay = call(
        &app,
        "POST",
        &path,
        plan("retained-0", 1, 10),
        OWNER,
        Some(generation),
    )
    .await;
    assert_eq!(replay.0, 202);
    assert_eq!(replay.1["id"].as_str(), first_id.as_deref());
    runtime.shutdown().await;
}

#[tokio::test(start_paused = true)]
async fn admission_requires_current_owner_control_and_a_running_active_session() {
    let (runtime, app, session, generation) = setup().await;
    let path = format!("/api/v1/sessions/{session}/tasks");
    assert_eq!(
        call(
            &app,
            "POST",
            &path,
            plan("missing-generation", 1, 10),
            OWNER,
            None
        )
        .await
        .0,
        403
    );
    assert_eq!(
        call(
            &app,
            "POST",
            &path,
            plan("wrong-owner", 1, 10),
            "22222222-2222-4222-8222-222222222222",
            Some(generation)
        )
        .await
        .0,
        409
    );
    assert_eq!(
        call(
            &app,
            "POST",
            &path,
            plan("stale-generation", 1, 10),
            OWNER,
            Some(generation + 1)
        )
        .await
        .0,
        409
    );
    runtime
        .running(&session, &format!("native:{OWNER}"), generation, false)
        .await
        .unwrap();
    assert_eq!(
        call(
            &app,
            "POST",
            &path,
            plan("stopped", 1, 10),
            OWNER,
            Some(generation)
        )
        .await
        .0,
        409
    );
    runtime
        .configure(
            &session,
            &format!("native:{OWNER}"),
            generation,
            runtime.get(&session).await.unwrap().revision,
            canharbor_core::Config {
                nominal_bitrate: 500000,
                data_bitrate: None,
                listen_only: true,
            },
        )
        .await
        .unwrap();
    runtime
        .running(&session, &format!("native:{OWNER}"), generation, true)
        .await
        .unwrap();
    assert_eq!(
        call(
            &app,
            "POST",
            &path,
            plan("listen-only", 1, 10),
            OWNER,
            Some(generation)
        )
        .await
        .0,
        409
    );
    let (_, value) = call(&app, "GET", "/api/v1/tasks", Value::Null, OWNER, None).await;
    assert!(value["tasks"].as_array().unwrap().is_empty());
    runtime.shutdown().await;
}
