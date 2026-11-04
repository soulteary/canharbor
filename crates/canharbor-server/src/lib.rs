// SPDX-License-Identifier: AGPL-3.0-or-later
//! Local transport and versioned DTOs for the M0 virtual workbench.
pub mod dto;
pub mod local;
use axum::{
    Extension, Json, Router,
    extract::{
        DefaultBodyLimit, Path, Request, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::{HeaderMap, StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use canharbor_core::runtime::{Runtime, RuntimeError};
use dto::{CreateRequest, PairRequest, Subscribe, Tx};
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;

use std::{collections::HashMap, sync::Arc, time::Duration};
use tokio::{
    sync::{Mutex, Semaphore, broadcast},
    time::Instant,
};
use uuid::Uuid;

#[derive(Clone, Copy)]
struct Native(bool);
#[derive(Clone)]
struct Identity {
    id: String,
    cookie: Option<String>,
    csrf: Option<String>,
}
struct BrowserSession {
    identity: Identity,
    created: Instant,
    touched: Instant,
}
struct PairCode {
    until: Instant,
}
struct Receipt {
    value: dto::TxReceipt,
    payload: String,
    until: Instant,
}
#[derive(Default)]
struct Auth {
    pairs: HashMap<String, PairCode>,
    browsers: HashMap<String, BrowserSession>,
}
pub struct AppState {
    pub runtime: Arc<Runtime>,
    pub origin: String,
    pub instance: String,
    web_enabled: bool,
    cookie_name: String,
    auth: Mutex<Auth>,
    receipts: Mutex<HashMap<String, Receipt>>,
    ws_slots: Arc<Semaphore>,
}
fn secret() -> String {
    format!(
        "{}{}{}",
        Uuid::new_v4().simple(),
        Uuid::new_v4().simple(),
        Uuid::new_v4().simple()
    )
}
impl AppState {
    pub fn new(runtime: Arc<Runtime>, origin: String) -> Arc<Self> {
        Self::with_web(runtime, origin, true)
    }
    pub fn with_web(runtime: Arc<Runtime>, origin: String, web_enabled: bool) -> Arc<Self> {
        let instance = Uuid::new_v4().simple().to_string();
        Arc::new(Self {
            runtime,
            origin,
            cookie_name: format!("canharbor_{instance}"),
            instance,
            web_enabled,
            auth: Mutex::new(Auth::default()),
            receipts: Mutex::new(HashMap::new()),
            ws_slots: Arc::new(Semaphore::new(16)),
        })
    }
    async fn issue_pair(&self) -> Result<String, ApiError> {
        if !self.web_enabled {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "web_disabled",
                "Web UI is disabled for this service",
            ));
        }
        let mut a = self.auth.lock().await;
        a.pairs.retain(|_, p| p.until > Instant::now());
        if a.pairs.len() >= 16 {
            return Err(ApiError::limit());
        }
        let code = secret();
        a.pairs.insert(
            code.clone(),
            PairCode {
                until: Instant::now() + Duration::from_secs(60),
            },
        );
        Ok(format!("{}/#pair={code}", self.origin))
    }
    async fn browser_valid(&self, token: &str) -> bool {
        let mut a = self.auth.lock().await;
        let now = Instant::now();
        a.browsers.retain(|_, s| {
            now.duration_since(s.created) < Duration::from_secs(8 * 3600)
                && now.duration_since(s.touched) < Duration::from_secs(1800)
        });
        a.browsers.contains_key(token)
    }
}
#[derive(Debug)]
pub struct ApiError(StatusCode, &'static str, String);
impl ApiError {
    fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> Self {
        Self(status, code, message.into())
    }
    fn limit() -> Self {
        Self::new(
            StatusCode::TOO_MANY_REQUESTS,
            "resource_limit",
            "resource limit reached",
        )
    }
    fn forbidden() -> Self {
        Self::new(
            StatusCode::FORBIDDEN,
            "forbidden",
            "request source or credentials rejected",
        )
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.0,
            Json(dto::ApiErrorBody {
                error: dto::ErrorDetail {
                    code: self.1.into(),
                    message: self.2,
                    retryable: false,
                    request_id: Uuid::new_v4().to_string(),
                },
            }),
        )
            .into_response()
    }
}
impl From<RuntimeError> for ApiError {
    fn from(e: RuntimeError) -> Self {
        let (status, code) = match e {
            RuntimeError::RevisionConflict => {
                (StatusCode::PRECONDITION_FAILED, "revision_conflict")
            }
            RuntimeError::Closed => (StatusCode::SERVICE_UNAVAILABLE, "service_closing"),
            RuntimeError::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            RuntimeError::Busy => (StatusCode::CONFLICT, "device_busy"),
            RuntimeError::LeaseConflict => (StatusCode::CONFLICT, "lease_conflict"),
            RuntimeError::LeaseExpired => (StatusCode::CONFLICT, "lease_expired"),
            RuntimeError::Limit => (StatusCode::TOO_MANY_REQUESTS, "resource_limit"),
            RuntimeError::ListenOnly | RuntimeError::InvalidState => {
                (StatusCode::CONFLICT, "invalid_state")
            }
            RuntimeError::Backend(canharbor_core::Error::Fault(f)) => (
                StatusCode::SERVICE_UNAVAILABLE,
                match f {
                    canharbor_core::BackendFault::Disconnected => "device_disconnected",
                    canharbor_core::BackendFault::BusOff => "bus_off",
                    canharbor_core::BackendFault::ReceiveOverflow => "receive_overflow",
                    canharbor_core::BackendFault::TransmitFailed => "transmit_failed",
                    canharbor_core::BackendFault::StopFailed => "stop_failed",
                },
            ),
            RuntimeError::Backend(canharbor_core::Error::UnknownChannel) => {
                (StatusCode::NOT_FOUND, "channel_not_found")
            }
            RuntimeError::Backend(canharbor_core::Error::QueueFull) => {
                (StatusCode::TOO_MANY_REQUESTS, "queue_full")
            }
            RuntimeError::Backend(canharbor_core::Error::InvalidState) => {
                (StatusCode::CONFLICT, "invalid_state")
            }
            RuntimeError::Backend(canharbor_core::Error::ControlExpired) => {
                (StatusCode::CONFLICT, "lease_expired")
            }
            RuntimeError::Backend(canharbor_core::Error::Unsupported) => {
                (StatusCode::UNPROCESSABLE_ENTITY, "unsupported")
            }
            RuntimeError::Backend(_) => (StatusCode::UNPROCESSABLE_ENTITY, "invalid_frame"),
        };
        Self::new(status, code, e.to_string())
    }
}
fn text_header<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers.get(name)?.to_str().ok()
}
fn generation(headers: &HeaderMap) -> Result<u64, ApiError> {
    text_header(headers, "x-canharbor-lease-generation")
        .and_then(|s| s.parse().ok())
        .ok_or_else(ApiError::forbidden)
}

/// Keep extractor failures within the same generated error envelope.
struct WireJson<T>(T);
impl<S, T> axum::extract::FromRequest<S> for WireJson<T>
where
    S: Send + Sync,
    T: serde::de::DeserializeOwned + Send,
{
    type Rejection = ApiError;
    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state)
            .await
            .map_err(|e| ApiError::new(e.status(), "invalid_request", e.body_text()))?;
        Ok(Self(value))
    }
}
/// Native identity is available only on the separately constructed, UID-checked UDS router.
async fn guard(
    State(s): State<Arc<AppState>>,
    Extension(native): Extension<Native>,
    mut req: Request,
    next: Next,
) -> Response {
    let path = req.uri().path().to_owned();
    let headers = req.headers().clone();
    let method = req.method().clone();
    let result: Result<Option<Identity>, ApiError> = async {
        if native.0 {
            let id = text_header(&headers, "x-canharbor-client")
                .and_then(|s| Uuid::parse_str(s).ok())
                .ok_or_else(ApiError::forbidden)?;
            return Ok(Some(Identity {
                id: format!("native:{id}"),
                cookie: None,
                csrf: None,
            }));
        }
        let expected = s.origin.strip_prefix("http://").unwrap();
        if text_header(&headers, "host") != Some(expected) {
            return Err(ApiError::forbidden());
        }
        let origin = text_header(&headers, "origin");
        if origin.is_some_and(|o| o != s.origin) {
            return Err(ApiError::forbidden());
        }
        if path.starts_with("/api/v1/native/") {
            return Err(ApiError::forbidden());
        }
        let unsafe_method = !matches!(
            method,
            axum::http::Method::GET | axum::http::Method::HEAD | axum::http::Method::OPTIONS
        );
        if unsafe_method
            && (origin != Some(s.origin.as_str())
                || text_header(&headers, "content-type") != Some("application/json"))
        {
            return Err(ApiError::forbidden());
        }
        if path == "/api/v1/version" || path == "/api/v1/auth/pair" || !path.starts_with("/api/") {
            return Ok(None);
        }
        let cookie = text_header(&headers, "cookie")
            .and_then(|h| {
                h.split(';')
                    .map(str::trim)
                    .find_map(|p| p.strip_prefix(&format!("{}=", s.cookie_name)))
            })
            .ok_or_else(|| {
                ApiError::new(
                    StatusCode::UNAUTHORIZED,
                    "unauthorized",
                    "pair this browser first",
                )
            })?
            .to_owned();
        if !s.browser_valid(&cookie).await {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "unauthorized",
                "browser session expired",
            ));
        }
        let mut auth = s.auth.lock().await;
        let b = auth
            .browsers
            .get_mut(&cookie)
            .ok_or_else(ApiError::forbidden)?;
        if unsafe_method && text_header(&headers, "x-canharbor-csrf") != b.identity.csrf.as_deref()
        {
            return Err(ApiError::forbidden());
        }
        b.touched = Instant::now();
        Ok(Some(b.identity.clone()))
    }
    .await;
    match result {
        Err(e) => e.into_response(),
        Ok(identity) => {
            if let Some(i) = identity {
                req.extensions_mut().insert(i);
            }
            let mut res = next.run(req).await;
            let h = res.headers_mut();
            h.insert(header::CACHE_CONTROL, "no-store".parse().unwrap());
            h.insert("x-content-type-options", "nosniff".parse().unwrap());
            h.insert("referrer-policy", "no-referrer".parse().unwrap());
            h.insert("content-security-policy",format!("default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' {}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",s.origin.replace("http:","ws:")).parse().unwrap());
            res
        }
    }
}
pub fn router(s: Arc<AppState>, native: bool) -> Router {
    Router::new()
        .route("/api/v1/version", get(version))
        .route("/api/v1/native/pair", post(native_pair))
        .route("/api/v1/auth/pair", post(pair))
        .route("/api/v1/auth/session", get(auth_session).delete(logout))
        .route("/api/v1/devices", get(devices))
        .route("/api/v1/channels/{id}/capabilities", get(capabilities))
        .route(
            "/api/v1/sessions/{id}/config",
            axum::routing::patch(configure),
        )
        .route("/api/v1/sessions", get(sessions).post(create))
        .route("/api/v1/sessions/{id}", get(session).delete(close))
        .route("/api/v1/sessions/{id}/lease", post(acquire).delete(release))
        .route("/api/v1/sessions/{id}/lease/renew", post(renew))
        .route("/api/v1/sessions/{id}/start", post(start))
        .route("/api/v1/sessions/{id}/stop", post(stop))
        .route("/api/v1/sessions/{id}/tx", post(transmit))
        .route("/api/v1/sessions/{id}/stream", get(stream))
        .route("/api/v1/diagnostics", get(diagnostics))
        .route("/api/v1/legal", get(legal))
        .fallback(static_file)
        .layer(DefaultBodyLimit::max(65536))
        .layer(middleware::from_fn_with_state(s.clone(), guard))
        .layer(Extension(Native(native)))
        .with_state(s)
}
async fn version(State(s): State<Arc<AppState>>) -> Json<dto::Version> {
    Json(dto::Version {
        version: env!("CARGO_PKG_VERSION").into(),
        api_version: "1.0".into(),
        server_instance_id: s.instance.clone(),
        stage: "m0-virtual".into(),
        web_ui: cfg!(feature = "web-ui"),
    })
}
async fn native_pair(State(s): State<Arc<AppState>>) -> Result<Json<dto::PairLink>, ApiError> {
    Ok(Json(dto::PairLink {
        url: s.issue_pair().await?,
    }))
}
async fn pair(
    State(s): State<Arc<AppState>>,
    WireJson(input): WireJson<PairRequest>,
) -> Result<Response, ApiError> {
    let mut a = s.auth.lock().await;
    let p = a
        .pairs
        .remove(&input.code)
        .ok_or_else(ApiError::forbidden)?;
    if p.until <= Instant::now() {
        return Err(ApiError::forbidden());
    }
    a.browsers.retain(|_, b| {
        b.created.elapsed() < Duration::from_secs(8 * 3600)
            && b.touched.elapsed() < Duration::from_secs(1800)
    });
    if a.browsers.len() >= 8 {
        return Err(ApiError::limit());
    }
    let token = secret();
    let id = Identity {
        id: format!("browser:{}", Uuid::new_v4()),
        cookie: Some(token.clone()),
        csrf: Some(secret()),
    };
    a.browsers.insert(
        token.clone(),
        BrowserSession {
            identity: id.clone(),
            created: Instant::now(),
            touched: Instant::now(),
        },
    );
    let mut response = Json(dto::Auth {
        client_id: id.id,
        csrf_token: id.csrf,
    })
    .into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        format!(
            "{}={token}; HttpOnly; SameSite=Strict; Path=/",
            s.cookie_name
        )
        .parse()
        .unwrap(),
    );
    Ok(response)
}
async fn auth_session(Extension(i): Extension<Identity>) -> Json<dto::Auth> {
    Json(dto::Auth {
        client_id: i.id,
        csrf_token: i.csrf,
    })
}
async fn logout(State(s): State<Arc<AppState>>, Extension(i): Extension<Identity>) -> StatusCode {
    if let Some(token) = i.cookie {
        s.auth.lock().await.browsers.remove(&token);
    }
    s.runtime.revoke(&i.id).await;
    StatusCode::NO_CONTENT
}
async fn devices(State(s): State<Arc<AppState>>) -> Json<dto::Devices> {
    let mut devices: std::collections::BTreeMap<String, dto::Device> =
        std::collections::BTreeMap::new();
    for channel in s.runtime.channels() {
        let Ok(caps) = s.runtime.capabilities(&channel.id) else {
            continue;
        };
        let device = devices
            .entry(caps.device_id.clone())
            .or_insert_with(|| dto::Device {
                id: caps.device_id.clone(),
                label: if caps.simulated {
                    "Virtual CAN bus".into()
                } else {
                    caps.device_id
                },
                backend: caps.backend,
                simulated: caps.simulated,
                verification: if caps.simulated {
                    "simulation_only"
                } else {
                    "hardware_unverified"
                }
                .into(),
                channels: Vec::new(),
            });
        device.channels.push(dto::Channel {
            id: channel.id,
            label: channel.label,
            fd: caps.fd,
            listen_only: caps.listen_only,
        });
    }
    Json(dto::Devices {
        devices: devices.into_values().collect(),
    })
}

async fn capabilities(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<dto::Capabilities>, ApiError> {
    let caps = s.runtime.capabilities(&id).map_err(RuntimeError::from)?;
    Ok(Json(dto::Capabilities {
        channel_id: id,
        backend: caps.backend,
        simulated: caps.simulated,
        fd: caps.fd,
        listen_only: caps.listen_only,
        hardware_timestamps: caps.timestamps,
        nominal_timing: caps.nominal_timing.map(Into::into),
        data_timing: caps.data_timing.map(Into::into),
        fixed_nominal_bitrates: caps.fixed_nominal_bitrates,
        fixed_data_bitrates: caps.fixed_data_bitrates,
    }))
}
fn session_with_etag(view: canharbor_core::runtime::SessionView) -> Response {
    let dto = dto::session(view);
    let etag = serde_json::to_string(&dto.revision).unwrap();
    let mut response = Json(dto).into_response();
    response
        .headers_mut()
        .insert(header::ETAG, etag.parse().unwrap());
    response
}
async fn configure(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    headers: HeaderMap,
    WireJson(config): WireJson<dto::Config>,
) -> Result<Response, ApiError> {
    let etag = text_header(&headers, "if-match").ok_or_else(|| {
        ApiError::new(
            StatusCode::PRECONDITION_REQUIRED,
            "revision_required",
            "If-Match is required",
        )
    })?;
    let revision = etag
        .strip_prefix('"')
        .and_then(|v| v.strip_suffix('"'))
        .and_then(|v| v.parse::<u64>().ok())
        .filter(|v| format!("\"{v}\"") == etag)
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                "invalid_revision",
                "If-Match must contain a quoted revision",
            )
        })?;
    let session = s.runtime.get(&id).await?;
    let core = validated_config(&s.runtime, &session.channel, config)?;
    Ok(session_with_etag(
        s.runtime
            .configure(&id, &i.id, generation(&headers)?, revision, core)
            .await?,
    ))
}
fn validated_config(
    runtime: &Runtime,
    channel: &str,
    config: dto::Config,
) -> Result<canharbor_core::Config, ApiError> {
    let caps = runtime.capabilities(channel).map_err(RuntimeError::from)?;
    if config.fd.as_ref().is_some_and(|fd| !fd.enabled || !fd.iso)
        || config.fd.is_some() && !caps.fd
        || config.mode == dto::SessionMode::ListenOnly && !caps.listen_only
    {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "unsupported",
            "requested mode is unsupported",
        ));
    }
    let data_bitrate = config.fd.map(|fd| fd.data_bitrate);
    Ok(canharbor_core::Config {
        nominal_bitrate: config.nominal_bitrate,
        data_bitrate,
        listen_only: config.mode == dto::SessionMode::ListenOnly,
    })
}
async fn sessions(State(s): State<Arc<AppState>>) -> Json<dto::Sessions> {
    Json(dto::Sessions {
        sessions: s
            .runtime
            .list()
            .await
            .into_iter()
            .map(dto::session)
            .collect(),
    })
}
async fn session(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Response, ApiError> {
    Ok(session_with_etag(s.runtime.get(&id).await?))
}
async fn create(
    State(s): State<Arc<AppState>>,
    WireJson(r): WireJson<CreateRequest>,
) -> Result<(StatusCode, Json<dto::Session>), ApiError> {
    let config = validated_config(&s.runtime, &r.channel_id, r.config)?;
    Ok((
        StatusCode::CREATED,
        Json(dto::session(
            s.runtime.create_configured(&r.channel_id, config).await?,
        )),
    ))
}

async fn acquire(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
) -> Result<Json<dto::Session>, ApiError> {
    Ok(Json(dto::session(s.runtime.acquire(&id, &i.id).await?)))
}
async fn renew(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
) -> Result<Json<dto::Session>, ApiError> {
    Ok(Json(dto::session(
        s.runtime.renew(&id, &i.id, generation(&h)?).await?,
    )))
}
async fn start(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
) -> Result<Json<dto::Session>, ApiError> {
    Ok(Json(dto::session(
        s.runtime.running(&id, &i.id, generation(&h)?, true).await?,
    )))
}
async fn stop(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
) -> Result<Json<dto::Session>, ApiError> {
    Ok(Json(dto::session(
        s.runtime
            .running(&id, &i.id, generation(&h)?, false)
            .await?,
    )))
}
async fn release(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
) -> Result<StatusCode, ApiError> {
    s.runtime.release(&id, &i.id, generation(&h)?).await?;
    Ok(StatusCode::NO_CONTENT)
}
async fn close(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
) -> Result<StatusCode, ApiError> {
    s.runtime.close(&id, &i.id, generation(&h)?).await?;
    Ok(StatusCode::NO_CONTENT)
}
async fn transmit(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
    WireJson(r): WireJson<Tx>,
) -> Result<(StatusCode, Json<dto::TxReceipt>), ApiError> {
    let g = generation(&h)?;
    if r.client_request_id.is_empty() || r.client_request_id.len() > 128 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "request ID must be 1..128 bytes",
        ));
    }
    let payload = serde_json::to_string(&r.frame).unwrap();
    let frame = r
        .frame
        .into_frame()
        .map_err(|e| ApiError::new(StatusCode::UNPROCESSABLE_ENTITY, "invalid_frame", e))?;
    let key = format!("{}:{id}:{g}:{}", i.id, r.client_request_id);
    let mut receipts = s.receipts.lock().await;
    receipts.retain(|_, r| r.until > Instant::now());
    if let Some(old) = receipts.get(&key) {
        if old.payload != payload {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "request_conflict",
                "request ID was used with another frame",
            ));
        }
        return Ok((StatusCode::ACCEPTED, Json(old.value.clone())));
    }
    if receipts.len() >= 1024 {
        return Err(ApiError::limit());
    }
    let session = s.runtime.get(&id).await?;
    let simulated = s
        .runtime
        .capabilities(&session.channel)
        .map_err(RuntimeError::from)?
        .simulated;
    s.runtime.send(&id, &i.id, g, frame).await?;
    let value = dto::TxReceipt {
        receipt: Uuid::new_v4().to_string(),
        state: dto::TxState::Submitted,
        simulated,
        confirmation: if simulated {
            dto::Confirmation::VirtualBusAccepted
        } else {
            dto::Confirmation::BackendSubmitted
        },
    };
    receipts.insert(
        key,
        Receipt {
            value: value.clone(),
            payload,
            until: Instant::now() + Duration::from_secs(300),
        },
    );
    Ok((StatusCode::ACCEPTED, Json(value)))
}
async fn diagnostics(State(s): State<Arc<AppState>>) -> Json<dto::Diagnostics> {
    Json(dto::Diagnostics {
        stage: "m1".into(),
        hardware_backends: s
            .runtime
            .channels()
            .into_iter()
            .filter_map(|channel| s.runtime.capabilities(&channel.id).ok())
            .filter(|caps| !caps.simulated)
            .map(|caps| caps.backend)
            .collect::<std::collections::BTreeSet<_>>()
            .into_iter()
            .collect(),
        session_count: s.runtime.list().await.len() as u32,
        stream_capacity: 256,
        ws_slots_available: s.ws_slots.available_permits() as u32,
    })
}
async fn legal() -> Json<dto::Legal> {
    Json(dto::Legal {
        license: "AGPL-3.0-or-later".into(),
        source_url: "https://github.com/soulteary/canharbor".into(),
        stage: "development".into(),
        exact_source_archive: None,
        notice: "Development build; release source packaging is not implemented in M0.".into(),
    })
}
async fn stream(
    State(s): State<Arc<AppState>>,
    Path(id): Path<String>,
    Extension(i): Extension<Identity>,
    h: HeaderMap,
    ws: WebSocketUpgrade,
) -> Result<Response, ApiError> {
    if i.cookie.is_some() && text_header(&h, "origin") != Some(s.origin.as_str()) {
        return Err(ApiError::forbidden());
    }
    let input = s.runtime.subscribe_all(&id).await?;
    let permit = s
        .ws_slots
        .clone()
        .try_acquire_owned()
        .map_err(|_| ApiError::limit())?;
    Ok(ws
        .max_message_size(8192)
        .on_upgrade(move |socket| async move {
            let _permit = permit;
            stream_loop(socket, s, id, i, input).await
        }))
}
async fn stream_loop(
    socket: WebSocket,
    s: Arc<AppState>,
    id: String,
    identity: Identity,
    mut input: broadcast::Receiver<canharbor_core::runtime::Notice>,
) {
    let (mut tx, mut rx) = socket.split();
    let subscribe = match tokio::time::timeout(Duration::from_secs(5), rx.next()).await {
        Ok(Some(Ok(Message::Text(t)))) => serde_json::from_str::<Subscribe>(&t).ok(),
        _ => None,
    };
    let Some(sub) = subscribe else { return };
    if sub.protocol_version != "1.0"
        || sub.csrf_token != identity.csrf
        || sub.filter.ids.len() > 256
    {
        return;
    }
    if sub.after_sequence.is_some() {
        let _ = tx
            .send(Message::Text(
                serde_json::to_string(&dto::StreamMessage::ResumeUnavailable)
                    .unwrap()
                    .into(),
            ))
            .await;
        return;
    }
    let hello = dto::StreamMessage::Hello {
        api_version: "1.0".into(),
        server_instance_id: s.instance.clone(),
        session_epoch: id.clone(),
        capacity: 256,
    };
    if tx
        .send(Message::Text(serde_json::to_string(&hello).unwrap().into()))
        .await
        .is_err()
    {
        return;
    }
    let mut ticker = tokio::time::interval(Duration::from_millis(20));
    let mut heartbeat = tokio::time::interval(Duration::from_secs(10));
    let mut last_pong = Instant::now();
    loop {
        tokio::select! {
            _ = heartbeat.tick() => {
                if last_pong.elapsed() > Duration::from_secs(30) || s.runtime.get(&id).await.is_err() { break; }
                if let Some(c) = &identity.cookie && !s.browser_valid(c).await { break; }
                if !matches!(tokio::time::timeout(Duration::from_secs(2), tx.send(Message::Ping(vec![].into()))).await, Ok(Ok(()))) { break; }
            }
            incoming = rx.next() => {
                match incoming {
                    Some(Ok(Message::Pong(_))) => last_pong = Instant::now(),
                    Some(Ok(Message::Ping(p))) => {
                        if !matches!(tokio::time::timeout(Duration::from_secs(2), tx.send(Message::Pong(p))).await, Ok(Ok(()))) { break; }
                    }
                    Some(Ok(Message::Text(t))) if t == "ping" => last_pong = Instant::now(),
                    _ => break,
                }
            }
            _ = ticker.tick() => {
                let mut events = Vec::new();
                let mut lagged = 0;
                let mut closed = false;
                for _ in 0..256 {
                    match input.try_recv() {
                        Ok(e) => {
                            if !visible_notice(&e,&sub.filter){continue;}
                            // Diagnostic loss/error events are never hidden by data filters.
                            events.push(dto::notice(e));
                        }
                        Err(broadcast::error::TryRecvError::Lagged(n)) => lagged += n,
                        Err(broadcast::error::TryRecvError::Closed) => {
                            closed = true;
                            break;
                        },
                        Err(broadcast::error::TryRecvError::Empty) => break,
                    }
                }
                if lagged > 0 {
                    let gap = dto::StreamMessage::Gap{cause:dto::GapCause::SubscriberLag,count:lagged.into()};
                    if !send_ws(&mut tx, gap).await { break; }
                }
                if !events.is_empty() && !send_ws(&mut tx, dto::StreamMessage::Events{server_instance_id:s.instance.clone(),session_epoch:id.clone(),events}).await { break; }
                if closed {
                            if let Ok(view)=s.runtime.get(&id).await && let Some(fault)=view.fault {
                                let state=if fault==canharbor_core::BackendFault::Disconnected {dto::SessionState::Disconnected}else{dto::SessionState::Faulted};
                                let _=send_ws(&mut tx,dto::StreamMessage::SessionFault{state,code:fault.into()}).await;
                            }
                            // Complete a close handshake instead of dropping the
                            // transport while a client may be replying to a ping.
                            let _ = tokio::time::timeout(Duration::from_secs(1), tx.send(Message::Close(None))).await;
                            let _ = tokio::time::timeout(Duration::from_secs(1), async {
                                while let Some(Ok(message)) = rx.next().await {
                                    match message {
                                        Message::Close(_) => break,
                                        Message::Ping(p) => { if tx.send(Message::Pong(p)).await.is_err() { break; } }
                                        _ => {}
                                    }
                                }
                            }).await;
                            return;
                }
            }
        }
    }
}

fn visible_notice(notice: &canharbor_core::runtime::Notice, filter: &dto::Filter) -> bool {
    match notice {
        canharbor_core::runtime::Notice::Diagnostic { .. } => true,
        canharbor_core::runtime::Notice::Frame(frame) => {
            (filter.ids.is_empty() || filter.ids.contains(&frame.frame.id().value()))
                && filter
                    .extended
                    .is_none_or(|extended| extended == frame.frame.id().extended())
                && filter
                    .direction
                    .as_ref()
                    .is_none_or(|direction| match direction {
                        dto::Direction::Rx => frame.direction == "rx",
                        dto::Direction::Tx => frame.direction == "tx",
                    })
        }
    }
}
async fn send_ws<T: Serialize>(
    tx: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    value: T,
) -> bool {
    matches!(
        tokio::time::timeout(
            Duration::from_secs(2),
            tx.send(Message::Text(serde_json::to_string(&value).unwrap().into()))
        )
        .await,
        Ok(Ok(()))
    )
}
#[cfg(feature = "web-ui")]
#[derive(rust_embed::RustEmbed)]
#[folder = "../../web/dist/"]
struct WebAssets;
async fn static_file(req: Request) -> Response {
    if req.method() != axum::http::Method::GET || req.uri().path().starts_with("/api/") {
        return StatusCode::NOT_FOUND.into_response();
    }
    #[cfg(feature = "web-ui")]
    {
        let path = req.uri().path().trim_start_matches('/');
        let path = if path.is_empty() { "index.html" } else { path };
        if let Some(file) = WebAssets::get(path) {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            return ([(header::CONTENT_TYPE, mime.as_ref())], file.data.to_vec()).into_response();
        }
        StatusCode::NOT_FOUND.into_response()
    }
    #[cfg(not(feature = "web-ui"))]
    {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            "Web UI was not included in this build. Build web/ and enable the web-ui feature.",
        )
            .into_response()
    }
}
