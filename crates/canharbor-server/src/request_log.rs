// SPDX-License-Identifier: AGPL-3.0-or-later
//! Optional request diagnostics on standard error.
//!
//! A line names the route template, never the concrete URL, so session,
//! capture and receipt identifiers, query strings, bodies and credentials are
//! not written. Successful reads are omitted: clients poll them continuously.
use axum::{
    extract::{MatchedPath, Request},
    http::{Method, StatusCode},
    middleware::Next,
    response::Response,
};
use std::{
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};

static ENABLED: AtomicBool = AtomicBool::new(false);

/// Process-wide switch, set once by the service entry point before serving.
pub fn enable() {
    ENABLED.store(true, Ordering::Relaxed);
}

/// `None` for successful reads; otherwise one line without a trailing newline.
pub fn line(
    method: &Method,
    route: Option<&str>,
    status: StatusCode,
    elapsed: Duration,
    native: bool,
) -> Option<String> {
    let read = matches!(*method, Method::GET | Method::HEAD | Method::OPTIONS);
    if read && status.as_u16() < 400 {
        return None;
    }
    Some(format!(
        "canharbor: request {method} {} -> {} in {} ms ({})",
        route.unwrap_or("(unmatched)"),
        status.as_u16(),
        elapsed.as_millis(),
        if native { "local client" } else { "browser" }
    ))
}

pub(crate) async fn layer(request: Request, next: Next) -> Response {
    if !ENABLED.load(Ordering::Relaxed) {
        return next.run(request).await;
    }
    let method = request.method().clone();
    let route = request
        .extensions()
        .get::<MatchedPath>()
        .map(|path| path.as_str().to_owned());
    let native = request
        .extensions()
        .get::<crate::Native>()
        .is_some_and(|native| native.0);
    let started = Instant::now();
    let response = next.run(request).await;
    if let Some(line) = line(
        &method,
        route.as_deref(),
        response.status(),
        started.elapsed(),
        native,
    ) {
        eprintln!("{line}");
    }
    response
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lines_use_route_templates_and_skip_successful_reads() {
        let ms = Duration::from_millis(12);
        assert_eq!(
            line(
                &Method::POST,
                Some("/api/v1/sessions/{id}/start"),
                StatusCode::CONFLICT,
                ms,
                true
            )
            .as_deref(),
            Some(
                "canharbor: request POST /api/v1/sessions/{id}/start -> 409 in 12 ms (local client)"
            )
        );
        assert_eq!(
            line(&Method::DELETE, None, StatusCode::NO_CONTENT, ms, false).as_deref(),
            Some("canharbor: request DELETE (unmatched) -> 204 in 12 ms (browser)")
        );
        assert!(
            line(
                &Method::GET,
                Some("/api/v1/devices"),
                StatusCode::OK,
                ms,
                true
            )
            .is_none()
        );
        assert!(
            line(
                &Method::GET,
                Some("/api/v1/sessions/{id}"),
                StatusCode::NOT_FOUND,
                ms,
                true
            )
            .is_some()
        );
    }
}
