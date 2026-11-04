// SPDX-License-Identifier: AGPL-3.0-or-later
use canharbor_core::{
    CanId, Frame,
    runtime::{Event, Mode, SessionView},
};
use serde::{Deserialize, Serialize};
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FrameDto {
    pub kind: String,
    pub id: u32,
    #[serde(default)]
    pub extended: bool,
    #[serde(default)]
    pub brs: bool,
    #[serde(default)]
    pub data_hex: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dlc: Option<u8>,
}
impl FrameDto {
    pub fn into_frame(self) -> Result<Frame, String> {
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
        let frame = match self.kind.as_str() {
            "classic_data" if !self.brs => Frame::classic(id, data),
            "classic_remote" if !self.brs && data.is_empty() => {
                Frame::remote(id, self.dlc.ok_or("RTR requires dlc")?)
            }
            "fd_data" => Frame::fd(id, data, self.brs),
            _ => return Err("invalid frame kind or flags".into()),
        }
        .map_err(|e| e.to_string())?;
        if self.dlc.is_some_and(|d| d != frame.dlc()) {
            return Err("DLC does not match payload".into());
        }
        Ok(frame)
    }
    pub fn from_frame(f: &Frame) -> Self {
        Self {
            kind: match f {
                Frame::ClassicData { .. } => "classic_data",
                Frame::ClassicRemote { .. } => "classic_remote",
                Frame::FdData { .. } => "fd_data",
            }
            .into(),
            id: f.id().value(),
            extended: f.id().extended(),
            brs: matches!(f, Frame::FdData { brs: true, .. }),
            data_hex: f.data().iter().map(|b| format!("{b:02X}")).collect(),
            dlc: Some(f.dlc()),
        }
    }
}
pub fn session(s: SessionView) -> serde_json::Value {
    serde_json::json!({"id":s.id,"channel_id":s.channel,"mode":if s.mode==Mode::Active{"active"}else{"listen_only"},"state":if s.running{"running"}else{"configured"},"revision":s.revision.to_string(),"generation":s.generation.to_string(),"controller":s.controller})
}
pub fn event(e: Event) -> serde_json::Value {
    serde_json::json!({"type":"frame_received","sequence":e.sequence.to_string(),"host_monotonic_ns":e.elapsed_ns.to_string(),"timestamp_quality":"host_only","direction":e.direction,"frame":FrameDto::from_frame(&e.frame)})
}
