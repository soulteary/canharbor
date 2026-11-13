// SPDX-License-Identifier: AGPL-3.0-or-later
//! Bounded offline inspection. This module does not open devices or submit frames.
use canharbor_api::{BusEvent, Decimal, FrameDto, FrameKind};
pub use canharbor_capture::Error;
use canharbor_capture::{Header, Reason, Record, Scan};
use serde::Serialize;
use std::{
    collections::VecDeque,
    io::{Read, Write},
};
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
    let mut frames = 0u64;
    let mut diagnostics = 0u64;
    let scan = validated(reader, |event| {
        match event {
            BusEvent::FrameReceived { .. } => frames += 1,
            BusEvent::BusDiagnostic { .. } => diagnostics += 1,
        }
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
/// Scan a capture and pass each event to `visit` after checking frame
/// invariants, metadata, diagnostic bytes and sequence/time order.
fn validated<R: Read>(
    reader: R,
    mut visit: impl FnMut(BusEvent) -> Result<(), Error>,
) -> Result<Scan, Error> {
    let mut previous = None;
    canharbor_capture::scan_with(reader, |record| {
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
                if raw_dlc.is_some_and(|dlc| {
                    dlc > 15
                        || (if matches!(frame.kind, FrameKind::FdData) {
                            dlc
                        } else {
                            dlc.min(8)
                        }) != frame.dlc
                }) || (frame.esi && !matches!(frame.kind, FrameKind::FdData))
                {
                    return Err(Error::Invalid("invalid captured frame metadata"));
                }
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
                (sequence, host_monotonic_ns)
            }
        };
        let sequence = sequence.as_str().parse::<u64>().unwrap();
        let time = time.as_str().parse::<u64>().unwrap();
        if previous.is_some_and(|(seq, ns)| sequence <= seq || time < ns) {
            return Err(Error::Invalid("capture sequence or time moved backwards"));
        }
        previous = Some((sequence, time));
        visit(event)
    })
}

#[derive(Debug, Serialize)]
pub struct Export {
    pub complete: bool,
    pub truncated: bool,
    pub frames: Decimal,
    pub skipped_diagnostics: Decimal,
    pub dropped: Decimal,
    pub unknown_loss: bool,
    pub reason: Option<Reason>,
}
/// Write the frames of a capture as a can-utils log (`candump -l` syntax):
/// `(seconds.microseconds) interface ID#DATA`, `ID#R<len>` for remote frames
/// and `ID##<flags>DATA` for CAN FD, where flags bit 0 is BRS and bit 1 is ESI.
///
/// The input gets the same validation as [`inspect`]. Timestamps are the
/// service's monotonic clock, not wall-clock time. The log syntax has no place
/// for direction, raw DLC, timestamp quality, diagnostics or gaps: diagnostics
/// are counted and skipped, and the summary reports whether the source was
/// complete. An error can leave partial output in `writer`.
pub fn export_candump<R: Read, W: Write>(
    reader: R,
    mut writer: W,
    interface: &str,
) -> Result<Export, Error> {
    if interface.is_empty()
        || interface.len() > 15
        || !interface
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'-'))
    {
        return Err(Error::Invalid("invalid candump interface name"));
    }
    let mut frames = 0u64;
    let mut skipped = 0u64;
    let scan = validated(reader, |event| {
        let BusEvent::FrameReceived {
            host_monotonic_ns,
            frame,
            ..
        } = event
        else {
            skipped += 1;
            return Ok(());
        };
        let ns = host_monotonic_ns.as_str().parse::<u64>().unwrap();
        write!(
            writer,
            "({}.{:06}) {interface} ",
            ns / 1_000_000_000,
            ns % 1_000_000_000 / 1_000
        )?;
        if frame.extended {
            write!(writer, "{:08X}", frame.id)?;
        } else {
            write!(writer, "{:03X}", frame.id)?;
        }
        match frame.kind {
            FrameKind::ClassicData => write!(writer, "#{}", frame.data_hex.to_ascii_uppercase())?,
            FrameKind::ClassicRemote if frame.dlc == 0 => write!(writer, "#R")?,
            FrameKind::ClassicRemote => write!(writer, "#R{}", frame.dlc)?,
            FrameKind::FdData => write!(
                writer,
                "##{:X}{}",
                u8::from(frame.brs) | u8::from(frame.esi) << 1,
                frame.data_hex.to_ascii_uppercase()
            )?,
        }
        writeln!(writer)?;
        frames += 1;
        Ok(())
    })?;
    writer.flush()?;
    Ok(Export {
        complete: scan.complete,
        truncated: scan.truncated,
        frames: frames.into(),
        skipped_diagnostics: skipped.into(),
        dropped: scan.dropped.into(),
        unknown_loss: scan.unknown_loss,
        reason: scan.reason,
    })
}
