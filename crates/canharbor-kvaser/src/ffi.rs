// SPDX-License-Identifier: BSD-3-Clause
// Adapted from KvaserUSB.h, macOS-CAN-Drivers d2d06333ce988916c971c25d4707afb25fde76ae.
// Copyright (C) 2017-2023 Kvaser AB, Molndal, Sweden
// Copyright (C) 2026 Cliff Rubio (macOS port)
// BSD-3-Clause option selected. Original header and license retained in third-party/.
use canharbor_driver::library::Library;
use std::{io, path::Path, sync::Arc};
#[repr(C)]
#[derive(Clone, Copy)]
pub struct Channel {
    pub handle: u32,
    pub name: [u8; 64],
    pub product: [u8; 64],
    pub pid: u16,
    pub channel: u8,
    pub channel_count: u8,
    pub fd: u8,
    pub available: u8,
    pub serial: u32,
}
impl Default for Channel {
    fn default() -> Self {
        Self {
            handle: 0,
            name: [0; 64],
            product: [0; 64],
            pid: 0,
            channel: 0,
            channel_count: 0,
            fd: 0,
            available: 0,
            serial: 0,
        }
    }
}
#[repr(C)]
#[derive(Clone, Copy)]
pub struct Message {
    pub id: u32,
    pub flags: u8,
    pub dlc: u8,
    pub len: u8,
    pub data: [u8; 64],
    pub timestamp: u64,
}
impl Default for Message {
    fn default() -> Self {
        Self {
            id: 0,
            flags: 0,
            dlc: 0,
            len: 0,
            data: [0; 64],
            timestamp: 0,
        }
    }
}
#[repr(C)]
#[derive(Default)]
pub struct Options {
    pub bitrate: i32,
    pub data_bitrate: i32,
    pub fd: i32,
    pub listen_only: i32,
    pub sample_point: i32,
    pub tseg1: i32,
    pub tseg2: i32,
    pub sjw: i32,
    pub data_tseg1: i32,
    pub data_tseg2: i32,
    pub data_sjw: i32,
}
pub struct Api {
    pub library: Arc<Library>,
    pub scan: unsafe extern "C" fn(*mut Channel, i32) -> i32,
    pub open: unsafe extern "C" fn(u32, *const Options) -> i32,
    pub close: unsafe extern "C" fn(u32),
    pub read: unsafe extern "C" fn(u32, *mut Message) -> i32,
    pub write: unsafe extern "C" fn(u32, *const Message) -> i32,
    pub status: unsafe extern "C" fn(u32, *mut i32, *mut u8, *mut u8) -> i32,
    pub parameters: unsafe extern "C" fn(u32, *mut i32, *mut i32, *mut i32, *mut i32) -> i32,
    pub mode: unsafe extern "C" fn(u32, *mut i32) -> i32,
    pub capabilities: unsafe extern "C" fn(u32, *mut u32) -> i32,
    pub version: unsafe extern "C" fn() -> *const std::ffi::c_char,
}
impl Api {
    /// # Safety
    /// The image must implement the retained libKvaserUSB 1.0.2 ABI, including
    /// valid pointers, bounded control operations and nonblocking read/write.
    pub unsafe fn load(path: &Path) -> io::Result<Self> {
        // SAFETY: exact signatures from the retained header; caller trusts the image.
        unsafe {
            let library = Library::load(path)?;
            Ok(Self {
                scan: library.symbol(c"kv_scan")?,
                open: library.symbol(c"kv_open")?,
                close: library.symbol(c"kv_close")?,
                read: library.symbol(c"kv_read")?,
                write: library.symbol(c"kv_write")?,
                status: library.symbol(c"kv_status")?,
                parameters: library.symbol(c"kv_get_busparams")?,
                mode: library.symbol(c"kv_get_driver_mode")?,
                capabilities: library.symbol(c"kv_capabilities")?,
                version: library.symbol(c"kv_library_version")?,
                library,
            })
        }
    }
}
