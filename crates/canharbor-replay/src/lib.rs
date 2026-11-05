// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded offline inspection. This module does not open devices or submit frames.
use canharbor_api::{BusEvent, Decimal, FrameDto, FrameKind};
use canharbor_capture::{Error, Header, Reason, Record};
use serde::Serialize;
use std::{collections::VecDeque, io::Read};
#[derive(Debug, Serialize)]
pub struct Inspection {
    pub header: Header,
    pub complete: bool,
    pub truncated: bool,
    pub valid_bytes: Decimal,
    pub events: Decimal,
    pub frames: Decimal,
    pub diagnostics: Decimal,
    pub dropped: Decimal,
    pub unknown_loss: bool,
    pub reason: Option<Reason>,
    pub preview: Vec<BusEvent>,
}
/// Retain only the last `limit` events (0–500); scan the entire bounded source.
/// Raw DLC, direction, ESI and timestamps remain in the preview. Diagnostics
/// are counted separately and never interpreted as transmit data.
pub fn inspect<R: Read>(reader: R, limit: usize) -> Result<Inspection, Error> {
    if limit > 500 {
        return Err(Error::Invalid("preview limit exceeds 500"));
    }
    let mut preview = VecDeque::with_capacity(limit);
    let mut previous = None;
    let mut frames = 0u64;
    let mut diagnostics = 0u64;
    let scan = canharbor_capture::scan_with(reader, |record| {
        let Record::Event { event } = record else {
            return Ok(());
        };
        let event: BusEvent = serde_json::from_value(event.clone())?;
        let (sequence, time) = match &event {
            BusEvent::FrameReceived {
                sequence,
                host_monotonic_ns,
                raw_dlc,
                frame,
                ..
            } => {
                FrameDto {
                    kind: frame.kind,
                    id: frame.id,
                    extended: frame.extended,
                    brs: frame.brs,
                    data_hex: frame.data_hex.clone(),
                    dlc: Some(frame.dlc),
                }
                .into_frame()
                .map_err(|_| Error::Invalid("invalid captured frame"))?;
                if raw_dlc.is_some_and(|dlc| dlc > 15)
                    || (frame.esi && !matches!(frame.kind, FrameKind::FdData))
                {
                    return Err(Error::Invalid("invalid captured frame metadata"));
                }
                frames += 1;
                (sequence, host_monotonic_ns)
            }
            BusEvent::BusDiagnostic {
                sequence,
                host_monotonic_ns,
                raw_data_hex,
                ..
            } => {
                if raw_data_hex.len() > 128
                    || !raw_data_hex.len().is_multiple_of(2)
                    || !raw_data_hex.bytes().all(|b| b.is_ascii_hexdigit())
                {
                    return Err(Error::Invalid("invalid diagnostic bytes"));
                }
                diagnostics += 1;
                (sequence, host_monotonic_ns)
            }
        };
        let sequence = sequence.as_str().parse::<u64>().unwrap();
        let time = time.as_str().parse::<u64>().unwrap();
        if previous.is_some_and(|(seq, ns)| sequence <= seq || time < ns) {
            return Err(Error::Invalid("capture sequence or time moved backwards"));
        }
        previous = Some((sequence, time));
        if limit != 0 {
            if preview.len() == limit {
                preview.pop_front();
            }
            preview.push_back(event);
        }
        Ok(())
    })?;
    Ok(Inspection {
        header: scan.header,
        complete: scan.complete,
        truncated: scan.truncated,
        valid_bytes: scan.valid_bytes.into(),
        events: scan.events.into(),
        frames: frames.into(),
        diagnostics: diagnostics.into(),
        dropped: scan.dropped.into(),
        unknown_loss: scan.unknown_loss,
        reason: scan.reason,
        preview: preview.into(),
    })
}
