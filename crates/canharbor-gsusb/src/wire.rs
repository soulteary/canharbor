// SPDX-License-Identifier: AGPL-3.0-or-later
use crate::Error;
use canharbor_core::{CanId, Frame};

pub const RX_ECHO: u32 = u32::MAX;
const EFF: u32 = 1 << 31;
const RTR: u32 = 1 << 30;
const ERR: u32 = 1 << 29;
const FD: u8 = 2;
const BRS: u8 = 4;
const ESI: u8 = 8;
const LENGTHS: [usize; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 32, 48, 64];

#[derive(Debug, Clone, Copy, Default)]
pub struct Layout {
    pub fd: bool,
    pub timestamps: bool,
    /// Explicit firmware quirk: retain raw Classic DLC 9..15, with 8 data bytes.
    pub classic_len8_dlc: bool,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Payload {
    Frame(Frame),
    /// SocketCAN error class bits and untouched diagnostic bytes, never a data frame.
    Error {
        classes: u32,
        data: [u8; 8],
    },
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Packet {
    pub echo_id: u32,
    pub channel: u8,
    pub dlc: u8,
    pub overflow: bool,
    pub esi: bool,
    pub timestamp_us: Option<u32>,
    pub payload: Payload,
}
pub(crate) fn u32le(bytes: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes(bytes[offset..offset + 4].try_into().unwrap())
}
/// Decode one complete firmware record. USB transfer framing belongs to the
/// transport: this function neither guesses concatenation nor buffers fragments.
pub fn decode(bytes: &[u8], layout: Layout, channels: u16) -> Result<Packet, Error> {
    if bytes.len() < 12 {
        return Err(Error::Protocol("short header"));
    }
    let flags = bytes[10];
    let fd = flags & FD != 0;
    let size = 12 + if fd { 64 } else { 8 };
    if bytes.len() != size + if layout.timestamps { 4 } else { 0 } {
        return Err(Error::Protocol("record length"));
    }
    if flags & !15 != 0 || bytes[11] != 0 {
        return Err(Error::Protocol("reserved flags"));
    }
    if u16::from(bytes[9]) >= channels {
        return Err(Error::Protocol("channel"));
    }
    if bytes[8] > 15 {
        return Err(Error::Protocol("DLC"));
    }
    if fd && !layout.fd {
        return Err(Error::Unsupported("CAN FD"));
    }
    if !fd && flags & (BRS | ESI) != 0 {
        return Err(Error::Protocol("FD flags on Classic frame"));
    }
    let raw_id = u32le(bytes, 4);
    let dlc = bytes[8];
    let payload = if raw_id & ERR != 0 {
        if fd || raw_id & (EFF | RTR) != 0 || dlc != 8 {
            return Err(Error::Protocol("error frame"));
        }
        Payload::Error {
            classes: raw_id & 0x1fff_ffff,
            data: bytes[12..20].try_into().unwrap(),
        }
    } else {
        let id = CanId::new(raw_id & 0x1fff_ffff, raw_id & EFF != 0)?;
        let frame = if fd {
            if raw_id & RTR != 0 {
                return Err(Error::Protocol("FD RTR"));
            }
            Frame::fd(
                id,
                bytes[12..12 + LENGTHS[usize::from(dlc)]].to_vec(),
                flags & BRS != 0,
            )?
        } else {
            if dlc > 8 && !layout.classic_len8_dlc {
                return Err(Error::Unsupported("Classic DLC above 8"));
            }
            if raw_id & RTR != 0 {
                Frame::remote(id, dlc.min(8))?
            } else {
                Frame::classic(id, bytes[12..12 + usize::from(dlc.min(8))].to_vec())?
            }
        };
        Payload::Frame(frame)
    };
    Ok(Packet {
        echo_id: u32le(bytes, 0),
        channel: bytes[9],
        dlc,
        overflow: flags & 1 != 0,
        esi: flags & ESI != 0,
        timestamp_us: layout.timestamps.then(|| u32le(bytes, size)),
        payload,
    })
}
/// Host-to-device records never include the optional receive timestamp.
pub fn encode(
    frame: &Frame,
    channel: u8,
    echo_id: u32,
    fd_enabled: bool,
) -> Result<Vec<u8>, Error> {
    frame.validate()?;
    if echo_id == RX_ECHO {
        return Err(Error::Protocol("reserved echo ID"));
    }
    let fd = matches!(frame, Frame::FdData { .. });
    if fd && !fd_enabled {
        return Err(Error::Unsupported("CAN FD"));
    }
    let mut bytes = vec![0; 12 + if fd { 64 } else { 8 }];
    bytes[..4].copy_from_slice(&echo_id.to_le_bytes());
    let mut id = frame.id().value();
    if frame.id().extended() {
        id |= EFF;
    }
    if matches!(frame, Frame::ClassicRemote { .. }) {
        id |= RTR;
    }
    bytes[4..8].copy_from_slice(&id.to_le_bytes());
    bytes[8] = frame.dlc();
    bytes[9] = channel;
    bytes[10] = if fd { FD } else { 0 }
        | if matches!(frame, Frame::FdData { brs: true, .. }) {
            BRS
        } else {
            0
        };
    bytes[12..12 + frame.data().len()].copy_from_slice(frame.data());
    Ok(bytes)
}
