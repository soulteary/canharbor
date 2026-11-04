// SPDX-License-Identifier: AGPL-3.0-or-later
use std::{error::Error, fmt};
#[derive(Debug)]
pub enum Failure {
    Input(String),
    Unknown(String),
    Reported { code: i32, message: String },
}
impl fmt::Display for Failure {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Input(message) | Self::Unknown(message) | Self::Reported { message, .. } => {
                f.write_str(message)
            }
        }
    }
}
impl Error for Failure {}
pub fn input(message: impl Into<String>) -> Box<dyn Error> {
    Box::new(Failure::Input(message.into()))
}
pub fn unknown(message: impl Into<String>) -> Box<dyn Error> {
    Box::new(Failure::Unknown(message.into()))
}
pub fn exit_code(error: &(dyn Error + 'static)) -> i32 {
    if let Some(error) = error.downcast_ref::<Failure>() {
        return match error {
            Failure::Input(_) => 2,
            Failure::Unknown(_) => 7,
            Failure::Reported { code, .. } => *code,
        };
    }
    if error.is::<canharbor_client::ServiceUnavailable>() {
        return 3;
    }
    if error.is::<canharbor_client::ResourceLimit>() {
        return 8;
    }
    if error.is::<canharbor_client::InvalidPath>()
        || error.is::<canharbor_client::InvalidArgument>()
    {
        return 2;
    }
    if let Some(error) = error.downcast_ref::<canharbor_client::ApiFailure>() {
        if error
            .detail
            .as_ref()
            .is_some_and(|detail| detail.outcome_unknown)
        {
            return 7;
        }
        if error.detail.as_ref().is_some_and(|detail| {
            detail.code == "device_disconnected" || detail.code == "channel_not_found"
        }) {
            return 4;
        }
        return match error.status {
            400 | 401 | 403 | 422 | 428 => 2,
            404 => 4,
            409 | 412 => 5,
            429 | 507 => 8,
            _ => 6,
        };
    }
    if let Some(error) = error.downcast_ref::<canharbor_core::Error>() {
        return match error {
            canharbor_core::Error::UnknownChannel => 4,
            canharbor_core::Error::InvalidState | canharbor_core::Error::ControlExpired => 5,
            canharbor_core::Error::QueueFull => 8,
            canharbor_core::Error::Unsupported | canharbor_core::Error::InvalidFrame => 2,
            canharbor_core::Error::Fault(canharbor_core::BackendFault::Disconnected) => 4,
            _ => 6,
        };
    }
    if let Some(error) = error.downcast_ref::<std::io::Error>() {
        return match error.kind() {
            std::io::ErrorKind::StorageFull
            | std::io::ErrorKind::QuotaExceeded
            | std::io::ErrorKind::OutOfMemory
            | std::io::ErrorKind::AlreadyExists => 8,
            _ => 6,
        };
    }
    6
}
