// SPDX-License-Identifier: AGPL-3.0-or-later
mod common;
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
use std::{sync::Arc, time::Duration};
use tower::ServiceExt;
// Each case measures real scheduler deadlines and process-wide resources while
// writing/fsyncing evidence. Concurrent stress fixtures interfere with those
// measurements; isolate cases while retaining their strict workload/loss checks.
static TIMED_CASE: tokio::sync::Semaphore = tokio::sync::Semaphore::const_new(1);
async fn call(app: &Router, method: &str, path: &str, body: Value) -> (StatusCode, Value) {
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(method)
                .uri(path)
                .header("host", "127.0.0.1:32180")
                .header("content-type", "application/json")
                .header("x-canharbor-client", "11111111-1111-4111-8111-111111111111")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        if bytes.is_empty() {
            Value::Null
        } else {
            serde_json::from_slice(&bytes).unwrap()
        },
    )
}
/// Deadlines missed by the host scheduler are the only reason this report did
/// not pass: nothing failed or is unknown, and every unmet criterion follows
/// from the skipped slots. A group or adaptive parent qualifies when each
/// member either passed or itself failed only by host skips.
///
/// The run's evidence must also be complete, error-free and verified, and RTT
/// accounting must be clean. Those failures are recorded outside the criteria
/// assessment, so a skip must not hide them.
fn failed_only_by_host_skips(report: &Value) -> bool {
    let evidence = &report["evidence"];
    let recovery = &report["recovery"];
    evidence["complete"] == true
        && evidence["error"].is_null()
        && recovery["status"] == "verified"
        && recovery["damaged_files"] == 0
        && skips_explain_failure(report)
}
/// The per-report part of the rule, applied to the run and to each member.
/// Members share the run's evidence and carry none of their own.
fn skips_explain_failure(report: &Value) -> bool {
    const SKIP_CRITERIA: [&str; 4] = [
        "min_submitted_ppm",
        "stage_min_submitted_ppm",
        "max_scheduler_skipped",
        "max_missing_expected_ppm",
    ];
    if report["verdict"] != "fail"
        || report["failed"] != 0
        || report["unknown"] != 0
        || report["counters_complete"] != true
        || report["skipped"]
            .as_u64()
            .is_none_or(|skipped| skipped == 0)
    {
        return false;
    }
    // Every probe that was sent must have been answered exactly once.
    let rtt = &report["rtt_report"];
    if !rtt.is_null()
        && ([
            "timed_out",
            "cancelled",
            "duplicate_responses",
            "invalid_responses",
            "late_or_unmatched",
            "responder_failed",
            "responder_unknown",
        ]
        .iter()
        .any(|counter| rtt[counter] != 0)
            || rtt["responder_submitted"] != report["submitted"]
            || rtt["latency"]["samples"] != report["submitted"])
    {
        return false;
    }
    // In pattern traffic a data frame is verified against the checkpoint sent
    // in the slot before it, so a skipped checkpoint leaves its submitted data
    // frame unverified.
    let unverified_after_skipped_checkpoint = |failure: &Value| {
        report["plan"]["traffic"]["format"] == "classic_pattern_v1"
            && failure["criterion"] == "max_missing_submitted_ppm"
            && failure["actual"].as_u64() <= report["skipped"].as_u64()
    };
    let criteria_follow_from_skips = |assessment: &Value| {
        assessment["failures"].as_array().is_some_and(|failures| {
            failures.iter().all(|failure| {
                failure["criterion"]
                    .as_str()
                    .is_some_and(|criterion| SKIP_CRITERIA.contains(&criterion))
                    || unverified_after_skipped_checkpoint(failure)
            })
        })
    };
    let members: Vec<&Value> = report["group"]["flows"]
        .as_array()
        .into_iter()
        .chain(report["adaptive"]["steps"].as_array())
        .flatten()
        .map(|member| &member["report"])
        .collect();
    if members.is_empty() {
        return report["state"] == "completed"
            && report["measurement_complete"] == true
            && report["errors"].as_array().is_some_and(Vec::is_empty)
            && criteria_follow_from_skips(&report["assessment"]);
    }
    // A parent stops or aborts once a member misses its criteria, so it may
    // have no assessment of its own.
    (report["assessment"].is_null() || criteria_follow_from_skips(&report["assessment"]))
        && members
            .iter()
            .all(|member| member["verdict"] == "pass" || skips_explain_failure(member))
}
/// Start a run and wait for its terminal report, for cases that examine the
/// persistence, replay and recovery of a clean run rather than host scheduling.
///
/// A loaded host can stall the test process past a slot deadline. The scheduler
/// then skips the slot and the unchanged strict criteria fail that run, as they
/// should. When that is the sole reason for the failure, the run is deleted and
/// started again under a new request ID, at most `ATTEMPTS` times. Any other
/// outcome, and the last attempt in every case, is returned for the caller's
/// assertions. Returns the request that was used, its creation response and
/// the terminal report.
async fn clean_run(app: &Router, request: &Value, wait: Duration) -> (Value, Value, Value) {
    const ATTEMPTS: usize = 4;
    let base = request["client_request_id"].as_str().unwrap();
    for attempt in 1..=ATTEMPTS {
        let mut request = request.clone();
        if attempt > 1 {
            request["client_request_id"] = format!("{base}-{attempt}").into();
        }
        let (status, start) = call(app, "POST", "/api/v1/stress/runs", request.clone()).await;
        assert_eq!(status, StatusCode::ACCEPTED, "{start}");
        // The same request identifies the same run instead of starting another.
        assert_eq!(
            call(app, "POST", "/api/v1/stress/runs", request.clone())
                .await
                .1["id"],
            start["id"]
        );
        let path = format!("/api/v1/stress/runs/{}", start["id"].as_str().unwrap());
        let report = tokio::time::timeout(wait, async {
            loop {
                let (_, report) = call(app, "GET", &path, Value::Null).await;
                if matches!(
                    report["state"].as_str(),
                    Some("completed" | "failed" | "aborted")
                ) {
                    break report;
                }
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        })
        .await
        .unwrap_or_else(|_| panic!("run {path} did not reach a terminal state in {wait:?}"));
        if attempt == ATTEMPTS || !failed_only_by_host_skips(&report) {
            return (request, start, report);
        }
        eprintln!(
            "attempt {attempt}: host skipped {} slot(s), max dispatch lateness {} ns; starting a new run",
            report["skipped"], report["max_dispatch_lateness_ns"]
        );
        // Deletion is refused while evidence for the finished run is still being written.
        let deleted = tokio::time::timeout(Duration::from_secs(30), async {
            loop {
                let (status, _) = call(app, "DELETE", &path, Value::Null).await;
                if status != StatusCode::CONFLICT {
                    break status;
                }
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        })
        .await
        .expect("skipped run remained busy");
        assert_eq!(deleted, StatusCode::NO_CONTENT);
    }
    unreachable!()
}
#[test]
fn only_reports_failed_solely_by_host_skips_qualify_for_another_run() {
    let unmet = |criteria: &[&str]| json!({"failures": criteria.iter().map(|c| json!({"criterion": c, "actual": 1})).collect::<Vec<_>>()});
    let leaf = |verdict: &str, skipped: u64, criteria: &[&str]| {
        json!({"state":"completed","verdict":verdict,"skipped":skipped,"failed":0,"unknown":0,
               "counters_complete":true,"measurement_complete":true,"errors":[],
               "evidence":{"complete":true,"error":null},
               "recovery":{"status":"verified","damaged_files":0},"rtt_report":null,
               "assessment":unmet(criteria),"plan":{"traffic":{"format":"classic_v1"}}})
    };
    let skipped = leaf(
        "fail",
        1,
        &[
            "min_submitted_ppm",
            "stage_min_submitted_ppm",
            "max_scheduler_skipped",
            "max_missing_expected_ppm",
        ],
    );
    assert!(failed_only_by_host_skips(&skipped));
    assert!(!failed_only_by_host_skips(&leaf("pass", 0, &[])));
    // A criterion that skipped slots do not explain keeps the failure.
    assert!(!failed_only_by_host_skips(&leaf(
        "fail",
        1,
        &["max_scheduler_skipped", "max_duplicates"]
    )));
    let lost = leaf(
        "fail",
        1,
        &["max_scheduler_skipped", "max_missing_submitted_ppm"],
    );
    assert!(!failed_only_by_host_skips(&lost));
    let mut pattern = lost.clone();
    pattern["plan"]["traffic"]["format"] = "classic_pattern_v1".into();
    assert!(failed_only_by_host_skips(&pattern));
    pattern["assessment"]["failures"][1]["actual"] = 2.into();
    assert!(!failed_only_by_host_skips(&pattern));
    for (field, value) in [
        ("failed", json!(1)),
        ("unknown", json!(1)),
        ("skipped", json!(0)),
        ("state", json!("aborted")),
        ("verdict", json!("inconclusive")),
        ("counters_complete", json!(false)),
        ("measurement_complete", json!(false)),
        ("errors", json!(["evidence replay failed"])),
        ("evidence", json!({"complete":false,"error":null})),
        (
            "evidence",
            json!({"complete":true,"error":"replay mismatch"}),
        ),
        ("recovery", json!({"status":"damaged","damaged_files":0})),
        ("recovery", json!({"status":"verified","damaged_files":1})),
    ] {
        let mut report = skipped.clone();
        report[field] = value;
        assert!(!failed_only_by_host_skips(&report), "{field}");
    }
    // RTT outcomes are accounted outside the criteria assessment.
    let rtt = |timed_out: u64, answered: u64| {
        let mut report = skipped.clone();
        report["submitted"] = 9.into();
        report["rtt_report"] = json!({"timed_out":timed_out,"cancelled":0,"duplicate_responses":0,
            "invalid_responses":0,"late_or_unmatched":0,"responder_failed":0,"responder_unknown":0,
            "responder_submitted":answered,"latency":{"samples":answered}});
        report
    };
    assert!(failed_only_by_host_skips(&rtt(0, 9)));
    assert!(!failed_only_by_host_skips(&rtt(1, 8)));
    assert!(!failed_only_by_host_skips(&rtt(0, 8)));
    // Parents stop or abort without an assessment once a member misses its criteria.
    // Members carry no evidence of their own; the run's evidence is checked once.
    let parent = |members: Value| {
        json!({"state":"aborted","verdict":"fail","skipped":1,"failed":0,"unknown":0,
               "counters_complete":true,"measurement_complete":false,"errors":["flow primary failed"],
               "evidence":{"complete":true,"error":null},
               "recovery":{"status":"verified","damaged_files":0},
               "assessment":null,"group":{"flows":members}})
    };
    let mut member = skipped.clone();
    member["evidence"] = json!({"complete":false,"error":null});
    member["recovery"] = json!({"status":"","damaged_files":0});
    assert!(failed_only_by_host_skips(&parent(
        json!([{"report": member}])
    )));
    let mut unverified = parent(json!([{"report": member}]));
    unverified["evidence"]["error"] = "replay mismatch".into();
    assert!(!failed_only_by_host_skips(&unverified));
    assert!(failed_only_by_host_skips(&parent(json!([
        {"report": skipped}, {"report": leaf("pass", 0, &[])}
    ]))));
    assert!(!failed_only_by_host_skips(&parent(json!([
        {"report": skipped}, {"report": leaf("fail", 0, &["max_duplicates"])}
    ]))));
    let mut adaptive = parent(json!([]));
    adaptive["group"] = Value::Null;
    adaptive["state"] = "failed".into();
    adaptive["adaptive"] = json!({"steps":[{"report": skipped}]});
    assert!(failed_only_by_host_skips(&adaptive));
}
fn plan() -> Value {
    json!({"sender":"virtual:0","receivers":["virtual:1"],"can_id":291,"extended":false,"run_tag":17,"count":5,"fps":10,"bitrate":500000,"receivers_active":true,"drain_ms":20})
}
#[tokio::test]
async fn api_idempotency_conflicts_validation_and_report() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::default()));
    let app = router(
        AppState::new(rt.clone(), "http://127.0.0.1:32180".into()),
        true,
    );
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/validate", plan())
            .await
            .0,
        StatusCode::OK
    );
    assert!(rt.list().await.is_empty());
    let (_, valid) = call(&app, "POST", "/api/v1/stress/validate", plan()).await;
    let request = json!({"client_request_id":"test","plan_hash":valid["plan_hash"],"active":true,"plan":plan()});
    let (status, a) = call(&app, "POST", "/api/v1/stress/runs", request.clone()).await;
    assert_eq!(status, StatusCode::ACCEPTED, "{a}");
    common::validate("StressReport", &a);
    let (_, b) = call(&app, "POST", "/api/v1/stress/runs", request.clone()).await;
    assert_eq!(a["id"], b["id"]);
    let mut conflict = request;
    conflict["plan"]["count"] = 6.into();
    let (_, valid) = call(
        &app,
        "POST",
        "/api/v1/stress/validate",
        conflict["plan"].clone(),
    )
    .await;
    conflict["plan_hash"] = valid["plan_hash"].clone();
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/runs", conflict).await.0,
        StatusCode::CONFLICT
    );
    let path = format!("/api/v1/stress/runs/{}", a["id"].as_str().unwrap());
    let mut completed = false;
    for _ in 0..1000 {
        let (_, r) = call(&app, "GET", &format!("{path}/report"), Value::Null).await;
        if r["state"] == "completed" {
            // This is an API/idempotency test, not a host scheduling benchmark.
            // Expired slots must be skipped and reported as unmet workload.
            let submitted = r["submitted"].as_u64().unwrap();
            let skipped = r["skipped"].as_u64().unwrap();
            assert_eq!(r["planned"], 5);
            assert_eq!(submitted + skipped, 5, "{r}");
            assert_eq!(r["attempted"], submitted);
            assert_eq!(r["failed"], 0);
            assert_eq!(r["unknown"], 0);
            assert_eq!(r["receivers"][0]["unique"], submitted);
            assert_eq!(r["receivers"][0]["missing_submitted"], 0);
            assert_eq!(r["receivers"][0]["missing_expected"], skipped);
            assert_eq!(r["measurement_complete"], true);
            assert_eq!(r["counters_complete"], true);
            assert_eq!(r["evidence"]["complete"], true);
            assert_eq!(r["recovery"]["status"], "verified");
            assert_eq!(
                r["verdict"],
                if skipped == 0 { "pass" } else { "fail" },
                "{r}"
            );
            assert_eq!(r["workload_achieved"], skipped == 0);
            common::validate("StressReport", &r);
            let (code, events) = call(
                &app,
                "GET",
                &format!("{path}/events?after_revision=0"),
                Value::Null,
            )
            .await;
            assert_eq!(code, StatusCode::OK);
            common::validate("StressEvents", &events);
            assert_eq!(events["gap"], false);
            assert_eq!(events["latest_revision"], r["lifecycle"]["revision"]);
            let latest = events["latest_revision"].as_u64().unwrap();
            let (_, empty) = call(
                &app,
                "GET",
                &format!("{path}/events?after_revision={latest}"),
                Value::Null,
            )
            .await;
            assert!(empty["events"].as_array().unwrap().is_empty());
            assert_eq!(
                call(
                    &app,
                    "GET",
                    &format!("{path}/events?after_revision={}", latest + 1),
                    Value::Null
                )
                .await
                .0,
                StatusCode::CONFLICT
            );
            completed = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    assert!(completed);
    assert!(rt.list().await.is_empty());
    assert_eq!(
        call(&app, "DELETE", &path, Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
}
#[tokio::test]
async fn active_required_and_stop_is_idempotent() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let app = router(
        AppState::new(
            Runtime::new(Arc::new(VirtualBus::default())),
            "http://127.0.0.1:32180".into(),
        ),
        true,
    );
    assert_eq!(
        call(
            &app,
            "POST",
            "/api/v1/stress/runs",
            json!({"client_request_id":"a","plan_hash":"bad","active":false,"plan":plan()})
        )
        .await
        .0,
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let mut p = plan();
    p["count"] = 1000.into();
    let (_, valid) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    let (_, r) = call(
        &app,
        "POST",
        "/api/v1/stress/runs",
        json!({"client_request_id":"b","plan_hash":valid["plan_hash"],"active":true,"plan":p}),
    )
    .await;
    let path = format!("/api/v1/stress/runs/{}/stop", r["id"].as_str().unwrap());
    assert_eq!(call(&app, "POST", &path, json!({})).await.0, StatusCode::OK);
    assert_eq!(call(&app, "POST", &path, json!({})).await.0, StatusCode::OK);
}

#[tokio::test]
async fn evidence_downloads_and_recovery_are_read_only() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    #[cfg(unix)]
    use std::os::unix::fs::MetadataExt;
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-p2-api-{}", uuid::Uuid::new_v4()));
    canharbor_platform::private::directory(&root).unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::default()));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.join("captures")),
    );
    let app = router(state.clone(), true);
    // Persistence is not a throughput gate: leave wide scheduling slots on busy hosts.
    let mut persisted_plan = plan();
    persisted_plan["fps"] = 2.into();
    let (_, valid) = call(
        &app,
        "POST",
        "/api/v1/stress/validate",
        persisted_plan.clone(),
    )
    .await;
    common::validate("StressValidation", &valid);
    let (status,start)=call(&app,"POST","/api/v1/stress/runs",json!({"client_request_id":"persisted","plan_hash":valid["plan_hash"],"active":true,"plan":persisted_plan})).await;
    assert_eq!(status, StatusCode::ACCEPTED, "{start}");
    let id = start["id"].as_str().unwrap();
    let path = format!("/api/v1/stress/runs/{id}");
    let mut finished = false;
    for _ in 0..1000 {
        let (_, r) = call(&app, "GET", &path, Value::Null).await;
        if r["state"] == "completed" {
            assert!(r["evidence"]["complete"].as_bool().unwrap(), "{r}");
            finished = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    assert!(finished);
    let (status, artifacts) = call(&app, "GET", &format!("{path}/artifacts"), Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    common::validate("StressArtifacts", &artifacts);
    assert!(
        artifacts["files"]
            .as_array()
            .unwrap()
            .iter()
            .any(|f| f["name"] == "manifest.json")
    );
    assert!(
        !artifacts["files"]
            .as_array()
            .unwrap()
            .iter()
            .any(|f| f["name"] == "identity.json")
    );
    let report_path = root.join("captures/stress").join(id).join("report.json");
    assert!(canharbor_platform::private::open_read(&report_path).is_ok());
    #[cfg(unix)]
    assert_eq!(
        std::fs::metadata(&report_path).unwrap().mode() & 0o777,
        0o600
    );
    let (status, manifest) = call(
        &app,
        "GET",
        &format!("{path}/artifacts/manifest.json"),
        Value::Null,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(manifest["plan_hash"], valid["plan_hash"]);
    assert_eq!(
        call(
            &app,
            "GET",
            &format!("{path}/artifacts/identity.json"),
            Value::Null
        )
        .await
        .0,
        StatusCode::NOT_FOUND
    );
    assert_eq!(
        call(
            &app,
            "GET",
            "/api/v1/stress/requests/persisted",
            Value::Null
        )
        .await
        .1["id"],
        id
    );
    // Keep a response body alive: evidence deletion must wait for its reader.
    let download = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("{path}/artifacts/manifest.json"))
                .header("host", "127.0.0.1:32180")
                .header("x-canharbor-client", "11111111-1111-4111-8111-111111111111")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(download.status(), StatusCode::OK);
    assert_eq!(
        call(&app, "DELETE", &path, Value::Null).await.0,
        StatusCode::CONFLICT
    );
    drop(download);
    drop(app);
    drop(state);
    let fresh = Runtime::new(Arc::new(VirtualBus::default()));
    let reopened = router(
        AppState::with_capture_dir(
            fresh.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (status, list) = call(&reopened, "GET", "/api/v1/stress/runs", Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list["runs"][0]["id"], id);
    assert!(fresh.list().await.is_empty());
    assert_eq!(
        call(&reopened, "GET", &path, Value::Null).await.1["submitted"],
        5
    );
    assert_eq!(
        call(&reopened, "DELETE", &path, Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
    std::fs::remove_dir_all(root).unwrap();
}
#[tokio::test]
async fn active_run_reserves_all_owners_and_bad_budgets_are_rejected() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let invalid_root = std::path::PathBuf::from(if cfg!(windows) {
            std::env::var_os("TEMP").expect("TEMP")
        } else {
            std::ffi::OsString::from("/tmp")
        })
        .join(format!("ch-p2-invalid-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir(&invalid_root).unwrap();
        std::fs::set_permissions(&invalid_root, std::fs::Permissions::from_mode(0o755)).unwrap();
        let rejected_runtime = Runtime::new(Arc::new(VirtualBus::default()));
        let rejected = router(
            AppState::with_capture_dir(
                rejected_runtime.clone(),
                "http://127.0.0.1:32180".into(),
                true,
                Some(invalid_root.clone()),
            ),
            true,
        );
        let (_, v) = call(&rejected, "POST", "/api/v1/stress/validate", plan()).await;
        let (status,error)=call(&rejected,"POST","/api/v1/stress/runs",json!({"client_request_id":"storage-rejected","plan_hash":v["plan_hash"],"active":true,"plan":plan()})).await;
        assert_eq!(status, StatusCode::INSUFFICIENT_STORAGE);
        assert_eq!(error["error"]["outcome_unknown"], false);
        assert!(rejected_runtime.list().await.is_empty());
        std::fs::remove_dir_all(invalid_root).unwrap();
    }
    let rt = Runtime::new(Arc::new(VirtualBus::default()));
    let state = AppState::new(rt.clone(), "http://127.0.0.1:32180".into());
    let app = router(state, true);
    let mut bad = plan();
    bad["evidence"] = json!({"max_bytes":1,"segment_bytes":4096,"sample_every":0});
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/validate", bad).await.0,
        StatusCode::UNPROCESSABLE_ENTITY
    );
    assert!(rt.list().await.is_empty());
    let mut p = plan();
    p["count"] = 1000.into();
    let (_, valid) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    let (_, first) = call(
        &app,
        "POST",
        "/api/v1/stress/runs",
        json!({"client_request_id":"first","plan_hash":valid["plan_hash"],"active":true,"plan":p}),
    )
    .await;
    assert_eq!(call(&app,"POST","/api/v1/stress/runs",json!({"client_request_id":"second","plan_hash":valid["plan_hash"],"active":true,"plan":p})).await.0,StatusCode::CONFLICT);
    let id = first["id"].as_str().unwrap();
    call(
        &app,
        "POST",
        &format!("/api/v1/stress/runs/{id}/stop"),
        json!({}),
    )
    .await;
    for _ in 0..1000 {
        let (_, r) = call(
            &app,
            "GET",
            &format!("/api/v1/stress/runs/{id}"),
            Value::Null,
        )
        .await;
        if r["state"] == "aborted" {
            assert_ne!(r["verdict"], "pass");
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
}

#[tokio::test]
#[ignore = "recorded high-rate virtual benchmark; no hardware; run explicitly"]
async fn recorded_high_rate_virtual_run_has_no_unreported_rx_loss() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let mut unmet = vec![];
    for (sliding, queues) in [(false, false), (true, true), (false, true), (true, false)] {
        let cpu_before = benchmark_cpu_seconds();
        let wall = std::time::Instant::now();
        let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
        let state = AppState::new(rt.clone(), "http://127.0.0.1:32180".into());
        let app = router(state, true);
        let mut p = plan();
        p["count"] = 10_000.into();
        p["fps"] = 10_000.into();
        p["evidence"] =
            json!({"max_bytes":64*1024*1024,"segment_bytes":4*1024*1024,"sample_every":20});
        if sliding {
            p["tracking"] = json!({"format":"sliding","capacity":4096});
        }
        if queues {
            p["queues"] = json!({"sample_every":100});
        }
        let (_, valid) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
        let (status,start)=call(&app,"POST","/api/v1/stress/runs",json!({"client_request_id":"high-rate","plan_hash":valid["plan_hash"],"active":true,"plan":p})).await;
        assert_eq!(status, StatusCode::ACCEPTED, "{start}");
        let id = start["id"].as_str().unwrap();
        let path = format!("/api/v1/stress/runs/{id}");
        let mut final_report = None;
        for _ in 0..1000 {
            let (_, r) = call(&app, "GET", &path, Value::Null).await;
            if matches!(
                r["state"].as_str(),
                Some("completed" | "failed" | "aborted")
            ) {
                final_report = Some(r);
                break;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
        let r = final_report.expect("benchmark deadline");
        assert_eq!(r["state"], "completed", "{r}");
        assert_eq!(
            r["submitted"].as_u64().unwrap() + r["skipped"].as_u64().unwrap(),
            10_000
        );
        assert_eq!(r["receivers"][0]["unique"], r["submitted"]);
        assert_eq!(r["receivers"][0]["missing_submitted"], 0);
        assert_eq!(r["rx_lag_events"], 0);
        assert_eq!(r["evidence"]["complete"], true);
        println!(
            "THROUGHPUT {}",
            json!({"sliding":sliding,"queues":queues,"target_fps":10000,"submitted":r["submitted"],"skipped":r["skipped"],"peer_rx":r["receivers"][0]["unique"],"verdict":r["verdict"],"wall_seconds":wall.elapsed().as_secs_f64(),"cpu_seconds":benchmark_cpu_seconds()-cpu_before,"evidence_bytes":r["evidence"]["bytes"],"recovery":r["recovery"]["status"],"max_dispatch_lateness_ns":r["max_dispatch_lateness_ns"],"receiver_queue_high_water":r["receivers"][0]["queue_high_water"]})
        );
        if r["submitted"] != 10000
            || r["skipped"] != 0
            || r["verdict"] != "pass"
            || r["recovery"]["status"] != "verified"
        {
            unmet.push((sliding, queues));
        }
        call(&app, "DELETE", &path, Value::Null).await;
        assert!(rt.list().await.is_empty());
    }
    assert!(
        unmet.is_empty(),
        "unchanged 10000 fps recorded gate unmet: {unmet:?}"
    );
}

fn benchmark_cpu_seconds() -> f64 {
    canharbor_platform::process::process_usage()
        .expect("process accounting available")
        .0
}

#[tokio::test]
async fn recorded_soak_observes_rss_and_independently_reconciles_every_rx_sample() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let app = router(
        AppState::new(rt.clone(), "http://127.0.0.1:32180".into()),
        true,
    );
    let mut p = plan();
    p["count"] = 500.into();
    p["fps"] = 100.into();
    p["stability"] = json!({"max_rss_growth_bytes":128*1024*1024,"warmup_seconds":1});
    p["evidence"] = json!({"max_bytes":64*1024*1024,"segment_bytes":4096,"sample_every":1});
    let (_, valid) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    let (status,start)=call(&app,"POST","/api/v1/stress/runs",json!({"client_request_id":"p3-soak","plan_hash":valid["plan_hash"],"active":true,"plan":p})).await;
    assert_eq!(status, StatusCode::ACCEPTED, "{start}");
    let path = format!("/api/v1/stress/runs/{}", start["id"].as_str().unwrap());
    let r = tokio::time::timeout(Duration::from_secs(15), async {
        loop {
            let (_, r) = call(&app, "GET", &path, Value::Null).await;
            if matches!(
                r["state"].as_str(),
                Some("completed" | "failed" | "aborted")
            ) {
                break r;
            }
            tokio::time::sleep(Duration::from_millis(20)).await;
        }
    })
    .await
    .unwrap();
    let submitted = r["submitted"].as_u64().unwrap();
    let skipped = r["skipped"].as_u64().unwrap();
    assert_eq!(submitted + skipped, 500);
    assert_eq!(
        r["verdict"],
        if skipped == 0 { "pass" } else { "fail" },
        "{r}"
    );
    assert_eq!(r["stability"]["status"], "monitoring");
    assert_eq!(r["recovery"]["status"], "verified");
    assert_eq!(r["recovery"]["sample_receivers"][0]["unique"], submitted);
    assert_eq!(r["recovery"]["sample_coverage"], "all_matching_rx_rows");
    assert!(r["recovery"]["audit_records"].as_u64().unwrap() >= 5);
    assert_eq!(r["recovery"]["counters_are_lower_bounds"], false);
    assert!(r["stability"]["samples"].as_u64().unwrap() >= 5);
    assert!(rt.list().await.is_empty());
    call(&app, "DELETE", &path, Value::Null).await;
}

#[tokio::test]
async fn quarantined_evidence_is_visible_and_blocks_new_admission_without_io() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    use std::io::Write;
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-p3-quarantine-{}", uuid::Uuid::new_v4()));
    let id = uuid::Uuid::new_v4().to_string();
    let directory = root.join("stress").join(&id);
    canharbor_platform::private::directory(&directory).unwrap();
    canharbor_platform::private::create_new(&directory.join("identity.json"))
        .unwrap()
        .write_all(b"broken")
        .unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::default()));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.clone()),
    );
    let app = router(state, true);
    let (status, list) = call(&app, "GET", "/api/v1/stress/runs", Value::Null).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list["recovery_issues"][0]["id"], id);
    let (_, valid) = call(&app, "POST", "/api/v1/stress/validate", plan()).await;
    let (status,_)=call(&app,"POST","/api/v1/stress/runs",json!({"client_request_id":"quarantine","plan_hash":valid["plan_hash"],"active":true,"plan":plan()})).await;
    assert_eq!(status, StatusCode::INSUFFICIENT_STORAGE);
    assert!(rt.list().await.is_empty());
    assert_eq!(
        std::fs::read(directory.join("identity.json")).unwrap(),
        b"broken"
    );
    std::fs::remove_dir_all(root).unwrap();
}

fn fd_plan() -> Value {
    let mut p = plan();
    p["count"] = 12.into();
    p["fps"] = 20.into();
    p["traffic"] = json!({"format":"fd_v1","data_bitrate":2000000,"stream":2,"epoch":3,"seed":42,"variants":[{"length":32,"brs":false},{"length":48,"brs":true},{"length":64,"brs":true}]});
    p["evidence"] = json!({"max_bytes":64*1024*1024,"segment_bytes":4096,"sample_every":1});
    p
}
#[tokio::test]
async fn fd_crc_and_rtt_report_survive_persisted_independent_replay() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let app = router(
        AppState::new(rt.clone(), "http://127.0.0.1:32180".into()),
        true,
    );
    let mut p = fd_plan();
    // Replay correctness test, not a scheduler/latency benchmark. Leave room for
    // loaded hosted runners and Windows timer granularity; all 12 replies remain required.
    p["rtt"] = json!({"response_can_id":292,"timeout_ms":1000,"max_inflight":32});
    p["drain_ms"] = 1000.into();
    let (_, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    let (_, start, r) = clean_run(
        &app,
        &json!({"client_request_id":"p4-rtt","plan_hash":v["plan_hash"],"active":true,"plan":p}),
        Duration::from_secs(5),
    )
    .await;
    let path = format!("/api/v1/stress/runs/{}", start["id"].as_str().unwrap());
    assert_eq!(r["verdict"], "pass", "{r}");
    assert_eq!(r["rtt_report"]["latency"]["samples"], 12);
    assert_eq!(r["recovery"]["status"], "verified");
    assert_eq!(r["integrity"], "crc32c_pattern_v1");
    assert!(rt.list().await.is_empty());
    call(&app, "DELETE", &path, Value::Null).await;
}
#[tokio::test]
async fn coordinated_prepare_abort_and_expiry_never_reanimate_a_group() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let app = router(
        AppState::new(rt.clone(), "http://127.0.0.1:32180".into()),
        true,
    );
    let mut p = fd_plan();
    let group = uuid::Uuid::new_v4().to_string();
    p["coordination"] = json!({"group_id":group,"participant":"node-a","lease_ms":3000,"start_delay_ms":2000,"clock_quality":"unsynchronized"});
    let (_, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    let req = json!({"operation":"prepare","group_id":group,"request":{"client_request_id":"coordinated","active":true,"plan_hash":v["plan_hash"],"plan":p}});
    let (status, ready) = call(&app, "POST", "/api/v1/stress/coordinate", req.clone()).await;
    assert_eq!(status, StatusCode::OK, "{ready}");
    assert_eq!(ready["state"], "prepared");
    assert!(rt.list().await.is_empty());
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/coordinate", req).await.0,
        StatusCode::CONFLICT
    );
    let action = |op: &str| json!({"operation":op,"group_id":group,"token":ready["token"]});
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/coordinate", action("commit"))
            .await
            .0,
        StatusCode::OK
    );
    let (_, first_commit) = call(&app, "POST", "/api/v1/stress/coordinate", action("commit")).await;
    tokio::time::sleep(Duration::from_millis(100)).await;
    let (_, duplicate) = call(&app, "POST", "/api/v1/stress/coordinate", action("commit")).await;
    assert_eq!(first_commit["run_id"], duplicate["run_id"]);
    assert!(
        duplicate["expires_in_ms"].as_u64().unwrap() + 50
            < first_commit["expires_in_ms"].as_u64().unwrap(),
        "duplicate commit must not renew a lease"
    );
    let (_, stopped) = call(&app, "POST", "/api/v1/stress/coordinate", action("abort")).await;
    let id = stopped["run_id"].as_str().unwrap();
    let path = format!("/api/v1/stress/runs/{id}");
    let r = tokio::time::timeout(Duration::from_secs(3), async {
        loop {
            let (_, r) = call(&app, "GET", &path, Value::Null).await;
            if r["state"] == "aborted" {
                break r;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .unwrap();
    assert_eq!(r["submitted"], 0);
    assert_eq!(r["state"], "aborted");
    assert_eq!(
        call(
            &app,
            "POST",
            "/api/v1/stress/coordinate",
            action("heartbeat")
        )
        .await
        .0,
        StatusCode::CONFLICT
    );
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/coordinate", action("commit"))
            .await
            .0,
        StatusCode::CONFLICT
    );
    call(&app, "DELETE", &path, Value::Null).await;
}

#[tokio::test]
async fn criteria_are_frozen_by_hash_idempotency_and_persisted_assessment() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-criteria-api-{}", uuid::Uuid::new_v4()));
    canharbor_platform::private::directory(&root).unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::default()));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.join("captures")),
    );
    let app = router(state.clone(), true);
    let mut p = plan();
    p["timing"] = json!({"sample_every":1,"max_pending":2});
    p["topology"] = json!({"bus":"virtual bench","aliases":[{"channel":"virtual:0","alias":"A"}]});
    p["criteria"] = json!({"max_duplicates":1,"max_missing_expected_ppm":200000});
    let (_, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    assert!(rt.list().await.is_empty());
    let request = json!({"client_request_id":"criteria-frozen","plan_hash":v["plan_hash"],"active":true,"plan":p});
    let (status, r) = call(&app, "POST", "/api/v1/stress/runs", request.clone()).await;
    assert_eq!(status, StatusCode::ACCEPTED, "{r}");
    let mut changed = request.clone();
    changed["plan"]["criteria"]["max_duplicates"] = 2.into();
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/runs", changed.clone())
            .await
            .0,
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let (_, new_v) = call(
        &app,
        "POST",
        "/api/v1/stress/validate",
        changed["plan"].clone(),
    )
    .await;
    assert_ne!(v["plan_hash"], new_v["plan_hash"]);
    changed["plan_hash"] = new_v["plan_hash"].clone();
    assert_eq!(
        call(&app, "POST", "/api/v1/stress/runs", changed).await.0,
        StatusCode::CONFLICT
    );
    let path = format!("/api/v1/stress/runs/{}", r["id"].as_str().unwrap());
    let mut finished = None;
    for _ in 0..1000 {
        let (_, report) = call(&app, "GET", &path, Value::Null).await;
        if report["state"] == "completed" {
            // This tests frozen criteria and persistence, not host scheduling.
            // A busy CI host may skip deadlines; those must remain a failure
            // under the unchanged strict submission criteria after recovery.
            let submitted = report["submitted"].as_u64().unwrap();
            let skipped = report["skipped"].as_u64().unwrap();
            assert_eq!(submitted + skipped, 5, "{report}");
            let passed = skipped == 0;
            assert_eq!(
                report["verdict"],
                if passed { "pass" } else { "fail" },
                "{report}"
            );
            common::validate("StressReport", &report);
            assert_eq!(report["version"], 8);
            assert_eq!(report["timing"]["request"]["submitted"], submitted);
            assert_eq!(report["timing"]["receivers"][0]["matched"], submitted);
            assert!(
                report["provenance"]["executable"]["sha256"]
                    .as_str()
                    .is_some_and(|h| h.len() == 64)
            );
            assert_eq!(report["assessment"]["passed"], passed, "{report}");
            assert_eq!(report["plan"]["criteria"]["max_duplicates"], 1);
            finished = Some(report);
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    let finished = finished.expect("criteria run did not complete");
    drop(app);
    drop(state);
    let fresh = Runtime::new(Arc::new(VirtualBus::default()));
    let reopened = router(
        AppState::with_capture_dir(
            fresh.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, recovered) = call(&reopened, "GET", &path, Value::Null).await;
    assert_eq!(recovered["recovery"]["status"], "verified", "{recovered}");
    assert_eq!(recovered["assessment"], finished["assessment"]);
    assert_eq!(recovered["verdict"], finished["verdict"]);
    assert_eq!(recovered["plan"]["criteria"]["max_duplicates"], 1);
    assert_eq!(recovered["timing"], finished["timing"]);
    assert_eq!(
        recovered["provenance"]["channels"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    assert!(fresh.list().await.is_empty());
    // A changed final source hash cannot replace the identity recorded before arming.
    let source_path = root
        .join("captures/stress")
        .join(r["id"].as_str().unwrap())
        .join("report.json");
    let mut changed: Value = serde_json::from_slice(&std::fs::read(&source_path).unwrap()).unwrap();
    changed["provenance"]["executable"]["sha256"] = json!("0".repeat(64));
    std::fs::write(&source_path, serde_json::to_vec(&changed).unwrap()).unwrap();
    let damaged = router(
        AppState::with_capture_dir(
            Runtime::new(Arc::new(VirtualBus::default())),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, unverified) = call(&damaged, "GET", &path, Value::Null).await;
    assert_ne!(unverified["verdict"], "pass");
    assert_ne!(unverified["recovery"]["status"], "verified");
    assert_ne!(
        unverified["provenance"]["executable"]["sha256"],
        json!("0".repeat(64))
    );

    assert_eq!(
        call(&reopened, "DELETE", &path, Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[tokio::test]
async fn multi_flow_api_persists_verifies_and_recovers_without_reopening_channels() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-b3-api-{}", uuid::Uuid::new_v4().simple()));
    canharbor_platform::private::directory(&root).unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.join("captures")),
    );
    let app = router(state.clone(), true);
    let mut p = plan();
    p["evidence"] = json!({"max_bytes":268435456,"segment_bytes":4194304,"sample_every":1});
    p["timing"] = json!({"sample_every":1,"max_pending":2});
    p["flows"] = json!([{"name":"reverse","sender":"virtual:1","receivers":["virtual:0"],"can_id":128,"extended":false,"run_tag":18,"count":5,"fps":10,"timing":{"sample_every":1,"max_pending":2}}]);
    let (code, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    assert_eq!(code, StatusCode::OK, "{v}");
    common::validate("StressValidation", &v);
    assert_eq!(v["group_budget"]["flow_count"], 2);
    assert_eq!(v["group_budget"]["devices"].as_array().unwrap().len(), 1);
    assert!(rt.list().await.is_empty());
    let request =
        json!({"client_request_id":"group","plan_hash":v["plan_hash"],"active":true,"plan":p});
    let (_, start, final_report) = clean_run(&app, &request, Duration::from_secs(10)).await;
    let path = format!("/api/v1/stress/runs/{}", start["id"].as_str().unwrap());
    assert_eq!(final_report["verdict"], "pass", "{final_report}");
    common::validate("StressReport", &final_report);
    assert_eq!(final_report["submitted"], 10);
    assert_eq!(final_report["group"]["flows"].as_array().unwrap().len(), 2);
    assert_eq!(final_report["backend_cleanup"].as_array().unwrap().len(), 2);
    assert!(rt.list().await.is_empty());
    // Stopping a completed flow is an idempotent no-op, never a write to finalized evidence.
    assert_eq!(
        call(
            &app,
            "POST",
            &format!("{path}/flows/reverse/stop"),
            json!({})
        )
        .await
        .0,
        StatusCode::OK
    );
    assert_eq!(
        call(
            &app,
            "POST",
            &format!("{path}/flows/unknown/stop"),
            json!({})
        )
        .await
        .0,
        StatusCode::NOT_FOUND
    );
    drop(app);
    drop(state);
    let fresh = Runtime::new(Arc::new(VirtualBus::default()));
    let reopened = router(
        AppState::with_capture_dir(
            fresh.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&reopened, "GET", &path, Value::Null).await;
    assert_eq!(r["recovery"]["status"], "verified", "{r}");
    assert_eq!(r["submitted"], 10);
    assert_eq!(
        r["group"]["flows"][1]["report"]["receivers"][0]["unique"],
        5
    );
    assert!(fresh.list().await.is_empty());
    let disk = root
        .join("captures/stress")
        .join(start["id"].as_str().unwrap())
        .join("report.json");
    let mut changed: Value = serde_json::from_slice(&std::fs::read(&disk).unwrap()).unwrap();
    changed["group"]["flows"][0]["report"]["submitted"] = 999.into();
    std::fs::write(&disk, serde_json::to_vec(&changed).unwrap()).unwrap();
    let damaged = router(
        AppState::with_capture_dir(
            Runtime::new(Arc::new(VirtualBus::default())),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&damaged, "GET", &path, Value::Null).await;
    assert_ne!(r["verdict"], "pass");
    assert_ne!(r["group"]["flows"][0]["report"]["submitted"], 999);
    assert_eq!(r["recovery"]["counters_are_lower_bounds"], true);
    assert_eq!(
        call(&reopened, "DELETE", &path, Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[tokio::test]
async fn classic_pattern_raw_evidence_replays_after_restart_and_tampered_control_accounting_fails()
{
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-b4-{}", uuid::Uuid::new_v4().simple()));
    canharbor_platform::private::directory(&root).unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.join("captures")),
    );
    let app = router(state.clone(), true);
    let mut p = plan();
    p["count"] = 6.into();
    p["fps"] = 4.into();
    p["drain_ms"] = 200.into();
    p["traffic"] = json!({"format":"classic_pattern_v1","checkpoint_can_id":292,"seed":42,"stream":7,"max_pending":2});
    p["evidence"] = json!({"sample_every":1,"max_bytes":268435456,"segment_bytes":4194304});
    let (status, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    assert_eq!(status, StatusCode::OK, "{v}");
    assert_eq!(v["version"], 11);
    common::validate("StressValidation", &v);
    let (_, start, final_report) = clean_run(
        &app,
        &json!({"client_request_id":"pattern","plan_hash":v["plan_hash"],"active":true,"plan":p}),
        Duration::from_secs(10),
    )
    .await;
    let id = start["id"].as_str().unwrap();
    let path = format!("/api/v1/stress/runs/{id}");
    assert_eq!(final_report["verdict"], "pass", "{final_report}");
    common::validate("StressReport", &final_report);
    assert_eq!(
        final_report["classic_pattern_transmit"]["checkpoint_submitted"],
        3
    );
    assert_eq!(
        final_report["receivers"][0]["classic_pattern"]["data_verified_unique"],
        3
    );
    assert!(rt.list().await.is_empty());
    drop(app);
    drop(state);
    let fresh = Runtime::new(Arc::new(VirtualBus::default()));
    let reopened = router(
        AppState::with_capture_dir(
            fresh.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&reopened, "GET", &path, Value::Null).await;
    assert_eq!(r["recovery"]["status"], "verified", "{r}");
    assert_eq!(
        r["classic_pattern_transmit"],
        final_report["classic_pattern_transmit"]
    );
    assert_eq!(r["receivers"], final_report["receivers"]);
    assert!(fresh.list().await.is_empty());
    let disk = root.join("captures/stress").join(id).join("report.json");
    let mut changed: Value = serde_json::from_slice(&std::fs::read(&disk).unwrap()).unwrap();
    changed["classic_pattern_transmit"]["checkpoint_submitted"] = 99.into();
    std::fs::write(&disk, serde_json::to_vec(&changed).unwrap()).unwrap();
    let recovered = Runtime::new(Arc::new(VirtualBus::default()));
    let damaged = router(
        AppState::with_capture_dir(
            recovered.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&damaged, "GET", &path, Value::Null).await;
    assert_ne!(r["verdict"], "pass");
    assert_eq!(r["recovery"]["counters_are_lower_bounds"], true);
    assert_eq!(r["classic_pattern_transmit"]["checkpoint_submitted"], 3);
    assert!(recovered.list().await.is_empty());
    call(&reopened, "DELETE", &path, Value::Null).await;
    std::fs::remove_dir_all(root).unwrap();
}

#[tokio::test]
async fn adaptive_steps_freeze_selection_and_recover_without_resubmitting() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-b5-{}", uuid::Uuid::new_v4().simple()));
    canharbor_platform::private::directory(&root).unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.join("captures")),
    );
    let app = router(state.clone(), true);
    let mut p = plan();
    p["count"] = 0.into();
    p["fps"] = 0.into();
    p["drain_ms"] = 200.into();
    p["adaptive"] = json!({"rates":[2,4],"exploration_seconds":1,"measurement_seconds":1,"min_observed_ppm":800000});
    p["shape"] = json!({"format":"seeded_intervals","seed":42,"jitter_ppm":500000});
    p["evidence"] = json!({"sample_every":1,"max_bytes":268435456,"segment_bytes":4194304});
    let (code, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    assert_eq!(code, StatusCode::OK, "{v}");
    common::validate("StressValidation", &v);
    assert_eq!(v["version"], 11);
    assert!(rt.list().await.is_empty());
    let request =
        json!({"client_request_id":"adaptive","plan_hash":v["plan_hash"],"active":true,"plan":p});
    let (_, start, saved) = clean_run(&app, &request, Duration::from_secs(15)).await;
    let id = start["id"].as_str().unwrap();
    let path = format!("/api/v1/stress/runs/{id}");
    assert_eq!(saved["verdict"], "pass", "{saved}");
    common::validate("StressReport", &saved);
    // Selection depends on observed wall-clock load, not only requested FPS.
    // A busy runner may legitimately reject 4 FPS and freeze 2 FPS instead.
    // Verify the actual 80% floor and exact per-step workload independently;
    // deterministic highest-candidate selection is covered by paused-time unit tests.
    let steps = saved["adaptive"]["steps"].as_array().unwrap();
    assert_eq!(steps.len(), 3);
    assert_eq!(steps[0]["name"], "explore-0");
    assert_eq!(steps[1]["name"], "explore-1");
    assert_eq!(steps[2]["name"], "measurement");
    let mut selected = 0;
    for (index, fps) in [2u64, 4].into_iter().enumerate() {
        let report = &steps[index]["report"];
        let load = &report["load"];
        let elapsed = load["end_ns"].as_u64().unwrap() - load["start_ns"].as_u64().unwrap();
        assert!(elapsed > 0);
        let meets_floor = u128::from(fps)
            * u128::from(load["scheduled_duration_ns"].as_u64().unwrap())
            * 1_000_000
            >= u128::from(fps) * u128::from(elapsed) * 800_000;
        assert_eq!(steps[index]["decision"]["qualified"], meets_floor);
        if meets_floor {
            selected = fps;
        }
    }
    assert_eq!(steps[0]["decision"]["qualified"], true);
    assert!([2, 4].contains(&selected));
    assert_eq!(saved["adaptive"]["selected_fps"], selected);
    for (step, fps) in steps.iter().zip([2u64, 4, selected]) {
        assert_eq!(step["report"]["plan"]["fps"], fps);
        assert_eq!(step["report"]["plan"]["count"], fps);
        assert_eq!(step["report"]["submitted"], fps);
        assert_eq!(step["report"]["verdict"], "pass");
        assert_eq!(step["report"]["measurement_complete"], true);
    }
    assert_eq!(saved["submitted"], 6 + selected);
    assert_eq!(saved["recovery"]["status"], "verified");
    assert!(rt.list().await.is_empty());
    drop(app);
    drop(state);
    let fresh = Runtime::new(Arc::new(VirtualBus::default()));
    let reopened = router(
        AppState::with_capture_dir(
            fresh.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&reopened, "GET", &path, Value::Null).await;
    assert_eq!(r["recovery"]["status"], "verified", "{r}");
    assert_eq!(r["adaptive"], saved["adaptive"]);
    assert!(fresh.list().await.is_empty());
    let disk = root.join("captures/stress").join(id).join("report.json");
    let mut changed: Value = serde_json::from_slice(&std::fs::read(&disk).unwrap()).unwrap();
    changed["adaptive"]["selected_fps"] = 999.into();
    std::fs::write(&disk, serde_json::to_vec(&changed).unwrap()).unwrap();
    let damaged_rt = Runtime::new(Arc::new(VirtualBus::default()));
    let damaged = router(
        AppState::with_capture_dir(
            damaged_rt.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&damaged, "GET", &path, Value::Null).await;
    assert_ne!(r["verdict"], "pass");
    assert_eq!(r["adaptive"]["selected_fps"], selected);
    assert_eq!(r["recovery"]["counters_are_lower_bounds"], true);
    assert!(damaged_rt.list().await.is_empty());
    assert_eq!(
        call(&reopened, "DELETE", &path, Value::Null).await.0,
        StatusCode::NO_CONTENT
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[tokio::test]
async fn sliding_queue_evidence_persists_and_recovers_without_opening_devices() {
    let _isolation = TIMED_CASE.acquire().await.unwrap();
    let root = std::path::PathBuf::from(if cfg!(windows) {
        std::env::var_os("TEMP").expect("TEMP")
    } else {
        std::ffi::OsString::from("/tmp")
    })
    .join(format!("ch-b6-{}", uuid::Uuid::new_v4().simple()));
    canharbor_platform::private::directory(&root).unwrap();
    let rt = Runtime::new(Arc::new(VirtualBus::new(8192)));
    let state = AppState::with_capture_dir(
        rt.clone(),
        "http://127.0.0.1:32180".into(),
        true,
        Some(root.join("captures")),
    );
    let app = router(state.clone(), true);
    let mut p = plan();
    p["count"] = 160.into();
    p["fps"] = 20.into();
    p["tracking"] = json!({"format":"sliding","capacity":64});
    p["queues"] = json!({"sample_every":3});
    p["evidence"] = json!({"sample_every":1,"max_bytes":268435456,"segment_bytes":4096});
    let (_, v) = call(&app, "POST", "/api/v1/stress/validate", p.clone()).await;
    assert_eq!(v["version"], 11, "{v}");
    assert!(rt.list().await.is_empty());
    let (code, start) = call(
        &app,
        "POST",
        "/api/v1/stress/runs",
        json!({"client_request_id":"window","plan_hash":v["plan_hash"],"active":true,"plan":p}),
    )
    .await;
    assert_eq!(code, StatusCode::ACCEPTED, "{start}");
    let path = format!("/api/v1/stress/runs/{}", start["id"].as_str().unwrap());
    let mut saved = Value::Null;
    for _ in 0..1500 {
        let (_, r) = call(&app, "GET", &path, Value::Null).await;
        if ["completed", "failed", "aborted"].contains(&r["state"].as_str().unwrap_or("")) {
            saved = r;
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    assert_eq!(saved["state"], "completed", "{saved}");
    assert_eq!(
        saved["verdict"],
        if saved["skipped"] == 0 {
            "pass"
        } else {
            "fail"
        },
        "{saved}"
    );
    assert_eq!(saved["submitted"], saved["receivers"][0]["unique"]);
    assert_eq!(saved["receivers"][0]["missing_submitted"], 0);
    assert_eq!(saved["recovery"]["status"], "verified", "{saved}");
    assert_eq!(
        saved["receivers"][0]["queues"]["samples"],
        saved["submitted"].as_u64().unwrap().div_ceil(3)
    );
    common::validate("StressReport", &saved);
    drop(app);
    drop(state);
    let fresh = Runtime::new(Arc::new(VirtualBus::default()));
    let reopened = router(
        AppState::with_capture_dir(
            fresh.clone(),
            "http://127.0.0.1:32180".into(),
            true,
            Some(root.join("captures")),
        ),
        true,
    );
    let (_, r) = call(&reopened, "GET", &path, Value::Null).await;
    assert_eq!(r["recovery"]["status"], "verified", "{r}");
    assert_eq!(r["receivers"], saved["receivers"]);
    assert!(fresh.list().await.is_empty());
    call(&reopened, "DELETE", &path, Value::Null).await;
    std::fs::remove_dir_all(root).unwrap();
}
