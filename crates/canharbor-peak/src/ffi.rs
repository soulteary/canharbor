// SPDX-License-Identifier: GPL-3.0-or-later
// C ABI definitions adapted from PeakUSB.h at
// cliffrubio/macOS-CAN-Drivers d2d06333ce988916c971c25d4707afb25fde76ae.
// Copyright (C) 1999-2025 PEAK-System Technik GmbH, Darmstadt
// Copyright (C) 2026 Cliff Rubio (macOS port)
// The upstream GPL-2.0-or-later option is used under GPLv3 or later here.
// Original header, notices, and license are retained under third-party/.
use canharbor_driver::library::Library;
use std::{io, path::Path, sync::Arc};
#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct Message {
    pub id: u32,
    pub flags: u8,
    pub len: u8,
    pub data: [u8; 8],
}
#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct Timestamp {
    pub millis: u32,
    pub overflow: u16,
    pub micros: u16,
}
#[repr(C)]
#[derive(Clone, Copy)]
pub struct MessageFd {
    pub id: u32,
    pub flags: u8,
    pub dlc: u8,
    pub data: [u8; 64],
}
impl Default for MessageFd {
    fn default() -> Self {
        Self {
            id: 0,
            flags: 0,
            dlc: 0,
            data: [0; 64],
        }
    }
}
#[repr(C)]
#[derive(Clone, Copy)]
pub struct ChannelInfo {
    pub handle: u16,
    pub device: u8,
    pub controller: u8,
    pub features: u32,
    pub name: [u8; 33],
    pub device_id: u32,
    pub condition: u32,
}
impl Default for ChannelInfo {
    fn default() -> Self {
        Self {
            handle: 0,
            device: 0,
            controller: 0,
            features: 0,
            name: [0; 33],
            device_id: 0,
            condition: 0,
        }
    }
}
pub const EMPTY: u32 = 0x20;
pub const OVERFLOW: u32 = 0x02 | 0x40;
pub const BUS_OFF: u32 = 0x10;
pub const BUS_ERRORS: u32 = 0x04 | 0x08 | 0x10 | 0x40000;
pub const TX_FULL: u32 = 0x01 | 0x80;
pub const RTR: u8 = 0x01;
pub const EXT: u8 = 0x02;
pub const FD: u8 = 0x04;
pub const BRS: u8 = 0x08;
pub const ESI: u8 = 0x10;
pub const ECHO: u8 = 0x20;
pub const ERROR: u8 = 0x40;
pub const STATUS: u8 = 0x80;
pub struct Api {
    pub library: Arc<Library>,
    pub initialize: unsafe extern "C" fn(u16, u16, u8, u32, u16) -> u32,
    pub initialize_fd: unsafe extern "C" fn(u16, *mut std::ffi::c_char) -> u32,
    pub uninitialize: unsafe extern "C" fn(u16) -> u32,
    pub read: unsafe extern "C" fn(u16, *mut Message, *mut Timestamp) -> u32,
    pub read_fd: unsafe extern "C" fn(u16, *mut MessageFd, *mut u64) -> u32,
    pub write: unsafe extern "C" fn(u16, *mut Message) -> u32,
    pub write_fd: unsafe extern "C" fn(u16, *mut MessageFd) -> u32,
    pub get_status: unsafe extern "C" fn(u16) -> u32,
    pub get: unsafe extern "C" fn(u16, u8, *mut std::ffi::c_void, u32) -> u32,
    pub set: unsafe extern "C" fn(u16, u8, *mut std::ffi::c_void, u32) -> u32,
}
impl Api {
    /// # Safety
    /// The selected image must implement the libPeakUSB 1.0.2 C ABI, including
    /// buffer bounds and nonblocking read/write contracts.
    pub unsafe fn load(path: &Path) -> io::Result<Self> {
        // SAFETY: the caller selects a trusted implementation of this exact ABI;
        // symbols are typed from the retained upstream header and tested in C.
        unsafe {
            let library = Library::load(path)?;
            Ok(Self {
                initialize: library.symbol(c"CAN_Initialize")?,
                initialize_fd: library.symbol(c"CAN_InitializeFD")?,
                uninitialize: library.symbol(c"CAN_Uninitialize")?,
                read: library.symbol(c"CAN_Read")?,
                read_fd: library.symbol(c"CAN_ReadFD")?,
                write: library.symbol(c"CAN_Write")?,
                write_fd: library.symbol(c"CAN_WriteFD")?,
                get_status: library.symbol(c"CAN_GetStatus")?,
                get: library.symbol(c"CAN_GetValue")?,
                set: library.symbol(c"CAN_SetValue")?,
                library,
            })
        }
    }
}
