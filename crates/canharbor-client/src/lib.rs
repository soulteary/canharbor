// SPDX-License-Identifier: AGPL-3.0-or-later
//! Same-user Unix-domain HTTP client. No implicit acquisition or TX retry.
pub use canharbor_api as api;
use serde_json::Value;
use std::{path::PathBuf, time::Duration};
use uuid::Uuid;
/// Structured error returned by an authenticated service response.
#[derive(Debug)]
pub struct ApiFailure {
    pub status: u16,
    pub detail: Option<api::ErrorDetail>,
}
impl std::fmt::Display for ApiFailure {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(detail) = &self.detail {
            write!(
                f,
                "HTTP {}: {}: {}",
                self.status, detail.code, detail.message
            )
        } else {
            write!(f, "HTTP {} from local service", self.status)
        }
    }
}
impl std::error::Error for ApiFailure {}
const JSON_LIMIT: usize = 1024 * 1024;
pub struct LocalClient {
    http: reqwest::Client,
    id: String,
}
impl LocalClient {
    pub fn new(dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            http: reqwest::Client::builder()
                .no_proxy()
                .redirect(reqwest::redirect::Policy::none())
                .unix_socket(dir.join("service.sock"))
                .timeout(Duration::from_secs(10))
                .build()?,
            id: Uuid::new_v4().to_string(),
        })
    }
    pub fn client_id(&self) -> &str {
        &self.id
    }
    pub async fn request(
        &self,
        method: &str,
        path: &str,
        body: Value,
        g: Option<&str>,
    ) -> Result<Value, Box<dyn std::error::Error>> {
        if !path.starts_with('/')
            || path.contains(['?', '#', '\\'])
            || path.split('/').any(|part| part == "." || part == "..")
        {
            return Err("expected an absolute API-relative path without query or fragment".into());
        }
        let mut req = self
            .http
            .request(method.parse()?, format!("http://localhost/api/v1{path}"))
            .header("x-canharbor-client", &self.id)
            .json(&body);
        if let Some(g) = g {
            req = req.header("x-canharbor-lease-generation", g)
        }
        let mut response = req.send().await.map_err(|e| {
            format!("cannot contact local service; run `canharbor serve` first: {e}")
        })?;
        let status = response.status();
        if status == reqwest::StatusCode::NO_CONTENT {
            return Ok(Value::Null);
        }
        if response
            .content_length()
            .is_some_and(|length| length > JSON_LIMIT as u64)
        {
            return Err("API response exceeds JSON limit".into());
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await? {
            if chunk.len() > JSON_LIMIT.saturating_sub(bytes.len()) {
                return Err("API response exceeds JSON limit".into());
            }
            bytes.extend_from_slice(&chunk);
        }
        let value: Value = serde_json::from_slice(&bytes)?;
        if !status.is_success() {
            let detail = serde_json::from_value::<api::ApiErrorBody>(value)
                .ok()
                .map(|body| body.error);
            return Err(Box::new(ApiFailure {
                status: status.as_u16(),
                detail,
            }));
        }
        Ok(value)
    }
    /// Send one request without retrying it. Unknown response fields are ignored
    /// by the shared response DTOs; malformed responses return decoding errors.
    pub async fn request_typed<T: serde::de::DeserializeOwned>(
        &self,
        method: &str,
        path: &str,
        body: Value,
        generation: Option<&str>,
    ) -> Result<T, Box<dyn std::error::Error>> {
        Ok(serde_json::from_value(
            self.request(method, path, body, generation).await?,
        )?)
    }
    pub async fn version(&self) -> Result<api::Version, Box<dyn std::error::Error>> {
        self.request_typed("GET", "/version", Value::Null, None)
            .await
    }
    pub async fn devices(&self) -> Result<api::Devices, Box<dyn std::error::Error>> {
        self.request_typed("GET", "/devices", Value::Null, None)
            .await
    }
    pub async fn create(
        &self,
        request: &api::CreateRequest,
    ) -> Result<api::Session, Box<dyn std::error::Error>> {
        self.request_typed("POST", "/sessions", serde_json::to_value(request)?, None)
            .await
    }
    pub async fn acquire(&self, id: &str) -> Result<api::Session, Box<dyn std::error::Error>> {
        session_id(id)?;
        self.request_typed(
            "POST",
            &format!("/sessions/{id}/lease"),
            serde_json::json!({}),
            None,
        )
        .await
    }
    pub async fn running(
        &self,
        id: &str,
        generation: &str,
        running: bool,
    ) -> Result<api::Session, Box<dyn std::error::Error>> {
        session_id(id)?;
        self.request_typed(
            "POST",
            &format!("/sessions/{id}/{}", if running { "start" } else { "stop" }),
            serde_json::json!({}),
            Some(generation),
        )
        .await
    }
    pub async fn submit(
        &self,
        id: &str,
        generation: &str,
        request: &api::Tx,
    ) -> Result<api::TxReceipt, Box<dyn std::error::Error>> {
        session_id(id)?;
        self.request_typed(
            "POST",
            &format!("/sessions/{id}/tx"),
            serde_json::to_value(request)?,
            Some(generation),
        )
        .await
    }
    pub async fn receipt(
        &self,
        session: &str,
        receipt: Uuid,
    ) -> Result<api::TxReceipt, Box<dyn std::error::Error>> {
        session_id(session)?;
        self.request_typed(
            "GET",
            &format!("/sessions/{session}/tx/{receipt}"),
            Value::Null,
            None,
        )
        .await
    }
    pub async fn download(
        &self,
        id: Uuid,
        output: PathBuf,
    ) -> Result<(), Box<dyn std::error::Error>> {
        use std::os::unix::fs::OpenOptionsExt;
        use tokio::io::AsyncWriteExt;
        let mut response = self
            .http
            .get(format!("http://localhost/api/v1/captures/{id}/download"))
            .header("x-canharbor-client", &self.id)
            .send()
            .await?
            .error_for_status()?;
        let limit = 64 * 1024 * 1024u64;
        let expected = response.content_length().ok_or("download has no length")?;
        if expected > limit {
            return Err("capture exceeds download limit".into());
        }
        let parent = output
            .parent()
            .filter(|p| !p.as_os_str().is_empty())
            .unwrap_or(std::path::Path::new("."));
        let temporary = parent.join(format!(".canharbor-{}.part", Uuid::new_v4()));
        struct Cleanup(PathBuf);
        impl Drop for Cleanup {
            fn drop(&mut self) {
                let _ = std::fs::remove_file(&self.0);
            }
        }
        let file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .mode(0o600)
            .open(&temporary)?;
        let cleanup = Cleanup(temporary);
        let mut file = tokio::fs::File::from_std(file);
        let mut received = 0u64;
        while let Some(chunk) = response.chunk().await? {
            received = received
                .checked_add(chunk.len() as u64)
                .ok_or("download length overflow")?;
            if received > expected || received > limit {
                return Err("capture download exceeds declared length".into());
            }
            file.write_all(&chunk).await?;
        }
        if received != expected {
            return Err("incomplete capture download".into());
        }
        file.sync_all().await?;
        drop(file);
        // Create the destination atomically without replacing an existing user file.
        tokio::fs::hard_link(&cleanup.0, &output).await?;
        Ok(())
    }
}

fn session_id(id: &str) -> Result<(), Box<dyn std::error::Error>> {
    if id.is_empty()
        || id.len() > 128
        || !id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-'))
    {
        return Err("invalid session ID".into());
    }
    Ok(())
}
