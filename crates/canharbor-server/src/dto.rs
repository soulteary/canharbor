// SPDX-License-Identifier: AGPL-3.0-or-later
//! The Rust wire contract. JSON Schema and TypeScript are generated from these types.
use canharbor_core::{
    CanId, Frame as CoreFrame,
    runtime::{Event, Mode, SessionView},
};
use schemars::{JsonSchema, Schema};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum FrameKind {
    ClassicData,
    ClassicRemote,
    FdData,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
#[schemars(rename = "FrameInput", transform = frame_constraints)]
pub struct FrameDto {
    pub kind: FrameKind,
    #[schemars(range(min = 0, max = 536870911))]
    pub id: u32,
    #[serde(default)]
    pub extended: bool,
    #[serde(default)]
    pub brs: bool,
    #[serde(default)]
    #[schemars(length(max = 128), pattern("^([0-9A-Fa-f]{2})*$"))]
    pub data_hex: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[schemars(range(min = 0, max = 15))]
    pub dlc: Option<u8>,
}
// Conditional wire constraints cannot be expressed by field annotations alone.
// Keep them attached to the DTO so every schema consumer gets the same rules.
fn frame_constraints(schema: &mut Schema) {
    schema.insert("allOf".into(), serde_json::json!([
        {"if":{"properties":{"extended":{"const":true}},"required":["extended"]},
         "else":{"properties":{"id":{"maximum":2047}}}},
        {"if":{"properties":{"kind":{"enum":["classic_data","classic_remote"]}}},
         "then":{"properties":{"brs":{"const":false},"data_hex":{"maxLength":16},"dlc":{"type":["integer","null"],"maximum":8}}}},
        {"if":{"properties":{"kind":{"const":"classic_remote"}}},
         "then":{"required":["dlc"],"properties":{"data_hex":{"const":""},"dlc":{"type":"integer","minimum":0,"maximum":8}}}},
        {"if":{"properties":{"kind":{"const":"fd_data"}}},
         "then":{"properties":{"data_hex":{"pattern":"^(([0-9A-Fa-f]{2}){0,8}|([0-9A-Fa-f]{2}){12}|([0-9A-Fa-f]{2}){16}|([0-9A-Fa-f]{2}){20}|([0-9A-Fa-f]{2}){24}|([0-9A-Fa-f]{2}){32}|([0-9A-Fa-f]{2}){48}|([0-9A-Fa-f]{2}){64})$"}}}}
    ]));
    let constraints = schema.get_mut("allOf").unwrap().as_array_mut().unwrap();
    // DLC must agree with wire payload length when supplied on a data frame.
    for (dlc, len) in [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 32, 48, 64]
        .into_iter()
        .enumerate()
    {
        let mut then =
            serde_json::json!({"properties":{"data_hex":{"minLength":len*2,"maxLength":len*2}}});
        if len != 0 {
            then["required"] = serde_json::json!(["data_hex"]);
        }
        constraints.push(serde_json::json!({
            "if":{"required":["dlc"],"properties":{"kind":{"enum":["classic_data","fd_data"]},"dlc":{"const":dlc}}},"then":then
        }));
    }
}
impl FrameDto {
    pub fn into_frame(self) -> Result<CoreFrame, String> {
        let id = CanId::new(self.id, self.extended).map_err(|e| e.to_string())?;
        if self.data_hex.len() > 128
            || !self.data_hex.len().is_multiple_of(2)
            || !self.data_hex.is_ascii()
        {
            return Err("data_hex must contain complete hex bytes".into());
        }
        let data = (0..self.data_hex.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&self.data_hex[i..i + 2], 16))
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| "invalid hex data")?;
        let frame = match self.kind {
            FrameKind::ClassicData if !self.brs => CoreFrame::classic(id, data),
            FrameKind::ClassicRemote if !self.brs && data.is_empty() => {
                CoreFrame::remote(id, self.dlc.ok_or("RTR requires dlc")?)
            }
            FrameKind::FdData => CoreFrame::fd(id, data, self.brs),
            _ => return Err("invalid frame kind or flags".into()),
        }
        .map_err(|e| e.to_string())?;
        if self.dlc.is_some_and(|d| d != frame.dlc()) {
            return Err("DLC does not match payload".into());
        }
        Ok(frame)
    }
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[schemars(transform = frame_constraints)]
pub struct Frame {
    pub kind: FrameKind,
    #[schemars(range(min = 0, max = 536870911))]
    pub id: u32,
    pub extended: bool,
    pub brs: bool,
    #[schemars(length(max = 128), pattern("^([0-9A-Fa-f]{2})*$"))]
    pub data_hex: String,
    pub dlc: u8,
}
impl From<&CoreFrame> for Frame {
    fn from(f: &CoreFrame) -> Self {
        Self {
            kind: match f {
                CoreFrame::ClassicData { .. } => FrameKind::ClassicData,
                CoreFrame::ClassicRemote { .. } => FrameKind::ClassicRemote,
                CoreFrame::FdData { .. } => FrameKind::FdData,
            },
            id: f.id().value(),
            extended: f.id().extended(),
            brs: matches!(f, CoreFrame::FdData { brs: true, .. }),
            data_hex: f.data().iter().map(|b| format!("{b:02X}")).collect(),
            dlc: f.dlc(),
        }
    }
}

/// Canonical u64 encoded as a decimal string to avoid JavaScript rounding.
#[derive(Clone, Debug, Serialize, JsonSchema)]
#[schemars(transform = decimal_constraints)]
pub struct Decimal(String);
impl<'de> Deserialize<'de> for Decimal {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let value = String::deserialize(deserializer)?;
        let number = value.parse::<u64>().map_err(serde::de::Error::custom)?;
        if value != number.to_string() {
            return Err(serde::de::Error::custom(
                "expected a canonical u64 decimal string",
            ));
        }
        Ok(number.into())
    }
}
fn decimal_constraints(schema: &mut Schema) {
    let max = u64::MAX.to_string();
    let mut alternatives = vec!["0".to_owned(), "[1-9][0-9]{0,18}".to_owned(), max.clone()];
    for (i, digit) in max.bytes().enumerate() {
        let lower = if i == 0 { b'1' } else { b'0' };
        if digit > lower {
            let upper = digit - 1;
            let range = if lower == upper {
                (lower as char).to_string()
            } else {
                format!("[{}-{}]", lower as char, upper as char)
            };
            let remaining = max.len() - i - 1;
            let suffix = if remaining == 0 {
                String::new()
            } else {
                format!("[0-9]{{{remaining}}}")
            };
            alternatives.push(format!("{}{range}{suffix}", &max[..i]));
        }
    }
    schema.insert(
        "pattern".into(),
        format!("^({})$", alternatives.join("|")).into(),
    );
}
impl From<u64> for Decimal {
    fn from(n: u64) -> Self {
        Self(n.to_string())
    }
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum SessionMode {
    Active,
    ListenOnly,
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum SessionState {
    Configured,
    Running,
    Faulted,
    Disconnected,
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum FaultCode {
    DeviceDisconnected,
    BusOff,
    ReceiveOverflow,
    TransmitFailed,
    StopFailed,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[schemars(transform = required_properties)]
pub struct Session {
    pub id: String,
    pub channel_id: String,
    pub mode: SessionMode,
    pub state: SessionState,
    pub revision: Decimal,
    pub generation: Decimal,
    pub controller: Option<String>,
    pub fault: Option<FaultCode>,
}
pub fn session(s: SessionView) -> Session {
    Session {
        id: s.id,
        channel_id: s.channel,
        mode: if s.mode == Mode::Active {
            SessionMode::Active
        } else {
            SessionMode::ListenOnly
        },
        state: match s.fault {
            Some(canharbor_core::BackendFault::Disconnected) => SessionState::Disconnected,
            Some(_) => SessionState::Faulted,
            None if s.running => SessionState::Running,
            None => SessionState::Configured,
        },
        revision: s.revision.into(),
        generation: s.generation.into(),
        controller: s.controller,
        fault: s.fault.map(Into::into),
    }
}
impl From<canharbor_core::BackendFault> for FaultCode {
    fn from(f: canharbor_core::BackendFault) -> Self {
        match f {
            canharbor_core::BackendFault::Disconnected => Self::DeviceDisconnected,
            canharbor_core::BackendFault::BusOff => Self::BusOff,
            canharbor_core::BackendFault::ReceiveOverflow => Self::ReceiveOverflow,
            canharbor_core::BackendFault::TransmitFailed => Self::TransmitFailed,
            canharbor_core::BackendFault::StopFailed => Self::StopFailed,
        }
    }
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Direction {
    Rx,
    Tx,
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum FrameEventKind {
    FrameReceived,
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum TimestampQuality {
    HostOnly,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct BusEvent {
    pub r#type: FrameEventKind,
    pub sequence: Decimal,
    pub host_monotonic_ns: Decimal,
    pub timestamp_quality: TimestampQuality,
    pub direction: Direction,
    pub frame: Frame,
}
pub fn event(e: Event) -> BusEvent {
    BusEvent {
        r#type: FrameEventKind::FrameReceived,
        sequence: e.sequence.into(),
        host_monotonic_ns: e.elapsed_ns.into(),
        timestamp_quality: TimestampQuality::HostOnly,
        direction: if e.direction == "tx" {
            Direction::Tx
        } else {
            Direction::Rx
        },
        frame: (&e.frame).into(),
    }
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StreamMessage {
    Hello {
        api_version: String,
        server_instance_id: String,
        session_epoch: String,
        capacity: u32,
    },
    Events {
        server_instance_id: String,
        session_epoch: String,
        events: Vec<BusEvent>,
    },
    Gap {
        cause: GapCause,
        count: Decimal,
    },
    ResumeUnavailable,
    SessionFault {
        state: SessionState,
        code: FaultCode,
    },
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum GapCause {
    SubscriberLag,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Filter {
    #[serde(default)]
    #[schemars(length(max = 256))]
    pub ids: Vec<u32>,
    #[serde(default)]
    pub extended: Option<bool>,
    #[serde(default)]
    pub direction: Option<Direction>,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum SubscribeKind {
    Subscribe,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Subscribe {
    pub r#type: SubscribeKind,
    pub protocol_version: String,
    #[serde(default)]
    pub csrf_token: Option<String>,
    #[serde(default)]
    pub after_sequence: Option<Decimal>,
    #[serde(default)]
    pub filter: Filter,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct PairRequest {
    pub code: String,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[schemars(transform = required_properties)]
pub struct Auth {
    pub client_id: String,
    pub csrf_token: Option<String>,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct FdConfig {
    pub enabled: bool,
    pub data_bitrate: u32,
    pub iso: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Config {
    pub mode: SessionMode,
    pub nominal_bitrate: u32,
    #[serde(default)]
    pub fd: Option<FdConfig>,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct CreateRequest {
    pub channel_id: String,
    pub config: Config,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Tx {
    #[schemars(length(min = 1, max = 128))]
    pub client_request_id: String,
    pub frame: FrameDto,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct Channel {
    pub id: String,
    pub label: String,
    pub fd: bool,
    pub listen_only: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct Device {
    pub id: String,
    pub label: String,
    pub backend: String,
    pub simulated: bool,
    pub verification: String,
    pub channels: Vec<Channel>,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct Devices {
    pub devices: Vec<Device>,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct Sessions {
    pub sessions: Vec<Session>,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct Version {
    pub version: String,
    pub api_version: String,
    pub server_instance_id: String,
    pub stage: String,
    pub web_ui: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct PairLink {
    pub url: String,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum TxState {
    Submitted,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Confirmation {
    VirtualBusAccepted,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct TxReceipt {
    pub receipt: String,
    pub state: TxState,
    pub simulated: bool,
    pub confirmation: Confirmation,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct Diagnostics {
    pub stage: String,
    pub hardware_backends: Vec<String>,
    pub session_count: u32,
    pub stream_capacity: u32,
    pub ws_slots_available: u32,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[schemars(transform = required_properties)]
pub struct Legal {
    pub license: String,
    pub source_url: String,
    pub stage: String,
    pub exact_source_archive: Option<String>,
    pub notice: String,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct ErrorDetail {
    pub code: String,
    pub message: String,
    pub retryable: bool,
    pub request_id: String,
}
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
pub struct ApiErrorBody {
    pub error: ErrorDetail,
}
/// Catalog of wire types, not an HTTP response. Exported definitions describe
/// implemented M0 payloads; routing and authentication remain in the API design.
#[derive(JsonSchema)]
pub struct Contract {
    pub counter: Decimal,
    pub session: Session,
    pub frame_input: FrameDto,
    pub auth: Auth,
    pub create_request: CreateRequest,
    pub tx: Tx,
    pub subscribe: Subscribe,
    pub stream_message: StreamMessage,
    pub devices: Devices,
    pub sessions: Sessions,
    pub version: Version,
    pub pair_request: PairRequest,
    pub pair_link: PairLink,
    pub tx_receipt: TxReceipt,
    pub diagnostics: Diagnostics,
    pub legal: Legal,
    pub error: ApiErrorBody,
}
fn required_properties(schema: &mut Schema) {
    let required = schema
        .get("properties")
        .unwrap()
        .as_object()
        .unwrap()
        .keys()
        .cloned()
        .collect::<Vec<_>>();
    schema.insert("required".into(), serde_json::json!(required));
}
pub fn schema() -> Schema {
    schemars::generate::SchemaSettings::draft07()
        .into_generator()
        .into_root_schema_for::<Contract>()
}
