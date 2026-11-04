// SPDX-License-Identifier: AGPL-3.0-or-later
use crate::{Error, wire::u32le};
pub const LISTEN_ONLY: u32 = 1;
pub const HW_TIMESTAMP: u32 = 1 << 4;
pub const FD: u32 = 1 << 8;
pub const BT_CONST_EXT: u32 = 1 << 10;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DeviceConfig {
    pub channels: u16,
    pub software_version: u32,
    pub hardware_version: u32,
}
impl DeviceConfig {
    pub fn parse(bytes: &[u8]) -> Result<Self, Error> {
        if bytes.len() != 12 {
            return Err(Error::Protocol("device config length"));
        }
        Ok(Self {
            channels: u16::from(bytes[3]) + 1,
            software_version: u32le(bytes, 4),
            hardware_version: u32le(bytes, 8),
        })
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Limits {
    pub tseg1_min: u32,
    pub tseg1_max: u32,
    pub tseg2_min: u32,
    pub tseg2_max: u32,
    pub sjw_max: u32,
    pub brp_min: u32,
    pub brp_max: u32,
    pub brp_inc: u32,
}
impl Limits {
    fn parse(bytes: &[u8]) -> Result<Self, Error> {
        let v = Self {
            tseg1_min: u32le(bytes, 0),
            tseg1_max: u32le(bytes, 4),
            tseg2_min: u32le(bytes, 8),
            tseg2_max: u32le(bytes, 12),
            sjw_max: u32le(bytes, 16),
            brp_min: u32le(bytes, 20),
            brp_max: u32le(bytes, 24),
            brp_inc: u32le(bytes, 28),
        };
        if v.tseg1_min == 0
            || v.tseg1_min > v.tseg1_max
            || v.tseg2_min == 0
            || v.tseg2_min > v.tseg2_max
            || v.sjw_max == 0
            || v.brp_min == 0
            || v.brp_min > v.brp_max
            || v.brp_inc == 0
        {
            return Err(Error::Protocol("bit timing limits"));
        }
        Ok(v)
    }
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Capabilities {
    /// Unknown feature bits are retained, never automatically enabled.
    pub features: u32,
    pub clock_hz: u32,
    pub nominal: Limits,
    pub data: Option<Limits>,
}
impl Capabilities {
    pub fn parse(bytes: &[u8]) -> Result<Self, Error> {
        if !matches!(bytes.len(), 40 | 72) {
            return Err(Error::Protocol("capabilities length"));
        }
        let clock_hz = u32le(bytes, 4);
        if clock_hz == 0 {
            return Err(Error::Protocol("zero CAN clock"));
        }
        Ok(Self {
            features: u32le(bytes, 0),
            clock_hz,
            nominal: Limits::parse(&bytes[8..40])?,
            data: if bytes.len() == 72 {
                Some(Limits::parse(&bytes[40..72])?)
            } else {
                None
            },
        })
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Timing {
    pub prop_seg: u32,
    pub phase_seg1: u32,
    pub phase_seg2: u32,
    pub sjw: u32,
    pub brp: u32,
}
impl Timing {
    pub fn validate(self, limits: Limits) -> Result<(), Error> {
        let tseg1 = self
            .prop_seg
            .checked_add(self.phase_seg1)
            .ok_or(Error::Protocol("timing overflow"))?;
        if limits.brp_inc == 0
            || !(limits.tseg1_min..=limits.tseg1_max).contains(&tseg1)
            || !(limits.tseg2_min..=limits.tseg2_max).contains(&self.phase_seg2)
            || self.sjw == 0
            || self.sjw > limits.sjw_max
            || self.sjw > self.phase_seg2
            || !(limits.brp_min..=limits.brp_max).contains(&self.brp)
            || !(self.brp - limits.brp_min).is_multiple_of(limits.brp_inc)
        {
            return Err(Error::Protocol("bit timing outside limits"));
        }
        Ok(())
    }
    pub fn bytes(self) -> Vec<u8> {
        [
            self.prop_seg,
            self.phase_seg1,
            self.phase_seg2,
            self.sjw,
            self.brp,
        ]
        .into_iter()
        .flat_map(u32::to_le_bytes)
        .collect()
    }
}
/// USB vendor/interface setup. Channel is wValue; interface is wIndex.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Request {
    pub input: bool,
    pub request: u8,
    pub value: u16,
    pub index: u16,
}
impl Request {
    pub fn request_type(&self) -> u8 {
        if self.input { 0xc1 } else { 0x41 }
    }
}
pub fn mode(start: bool, flags: u32) -> Vec<u8> {
    [u32::from(start), flags]
        .into_iter()
        .flat_map(u32::to_le_bytes)
        .collect()
}
