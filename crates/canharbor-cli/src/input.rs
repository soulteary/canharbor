// SPDX-License-Identifier: AGPL-3.0-or-later
//! Command-line spellings of hexadecimal values. Range and frame validation
//! stay with the frame constructors.

/// Hexadecimal digits with an optional `0x` or `0X` prefix.
pub fn hex_u32(value: &str) -> Result<u32, String> {
    let digits = value
        .strip_prefix("0x")
        .or_else(|| value.strip_prefix("0X"))
        .unwrap_or(value);
    if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err("expected hexadecimal digits with an optional 0x prefix".into());
    }
    u32::from_str_radix(digits, 16).map_err(|_| "hexadecimal value exceeds u32".into())
}

/// Hexadecimal bytes, optionally separated by spaces, colons, hyphens or dots.
/// Every group between separators must contain whole bytes, so `1 23` is
/// rejected rather than read as `0123` or `1230`.
pub fn payload_hex(value: &str) -> Result<String, String> {
    let mut bytes = String::with_capacity(value.len());
    for group in value.split(|c: char| c.is_ascii_whitespace() || matches!(c, ':' | '-' | '.')) {
        if !group.len().is_multiple_of(2) || !group.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err("payload must be complete hexadecimal bytes".into());
        }
        bytes.push_str(group);
    }
    Ok(bytes)
}

/// A frame in the notation used by can-utils `cansend`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FrameSpec {
    pub id: u32,
    pub extended: bool,
    pub fd: bool,
    pub brs: bool,
    /// Requested length of a remote frame; `None` for data frames.
    pub remote_dlc: Option<u8>,
    pub data_hex: String,
}

/// Parse `ID#DATA`, `ID#R[len]` or `ID##<flags>DATA`.
///
/// As in `cansend`, three identifier digits select an 11-bit identifier and
/// eight select a 29-bit one; other lengths are rejected instead of guessed.
/// Data bytes may be separated by dots. The CAN FD flags digit accepts only
/// bit 0 (BRS): ESI is set by a transmitter's error state, not by request.
pub fn frame_spec(value: &str) -> Result<FrameSpec, String> {
    let (id, rest) = value
        .split_once('#')
        .ok_or("expected ID#DATA, ID#R or ID##<flags>DATA")?;
    let extended = match id.len() {
        3 => false,
        8 => true,
        _ => return Err("identifier must have 3 (11-bit) or 8 (29-bit) hexadecimal digits".into()),
    };
    if !id.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err("identifier must be hexadecimal".into());
    }
    let mut spec = FrameSpec {
        id: u32::from_str_radix(id, 16).map_err(|_| "identifier must be hexadecimal")?,
        extended,
        fd: false,
        brs: false,
        remote_dlc: None,
        data_hex: String::new(),
    };
    let bytes = |text: &str| {
        if text.contains(|c: char| c != '.' && !c.is_ascii_hexdigit()) {
            return Err(
                "payload must be hexadecimal bytes, optionally separated by dots".to_owned(),
            );
        }
        payload_hex(text)
    };
    if let Some(fd) = rest.strip_prefix('#') {
        let mut characters = fd.chars();
        match characters.next() {
            Some('0') => {}
            Some('1') => spec.brs = true,
            Some(_) => return Err("CAN FD flags must be 0 or 1 (BRS)".into()),
            None => return Err("CAN FD frames need a flags digit after ##".into()),
        }
        spec.fd = true;
        spec.data_hex = bytes(characters.as_str())?;
    } else if let Some(length) = rest.strip_prefix('R') {
        spec.remote_dlc = Some(match length {
            "" => 0,
            _ => length
                .parse::<u8>()
                .ok()
                .filter(|dlc| length.len() == 1 && *dlc <= 8)
                .ok_or("remote frame length must be one digit from 0 to 8")?,
        });
    } else {
        spec.data_hex = bytes(rest)?;
    }
    Ok(spec)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frame_notation_follows_cansend() {
        let spec = |value| frame_spec(value).unwrap();
        let classic = spec("123#DEADBEEF");
        assert_eq!(
            (classic.id, classic.extended, classic.fd),
            (0x123, false, false)
        );
        assert_eq!(classic.data_hex, "DEADBEEF");
        assert_eq!(spec("123#").data_hex, "");
        assert_eq!(spec("123#DE.AD.be.ef").data_hex, "DEADbeef");
        let extended = spec("00000123#01");
        assert_eq!((extended.id, extended.extended), (0x123, true));
        assert_eq!(spec("7FF#R").remote_dlc, Some(0));
        assert_eq!(spec("7FF#R8").remote_dlc, Some(8));
        let fd = spec("123##1AABB");
        assert!(fd.fd && fd.brs);
        assert_eq!(fd.data_hex, "AABB");
        let plain_fd = spec("123##0");
        assert!(plain_fd.fd && !plain_fd.brs && plain_fd.data_hex.is_empty());
        for rejected in [
            "123",
            "#00",
            "12#00",
            "1234#00",
            "0x123#00",
            "12G#00",
            "123#0",
            "123#01 02",
            "123#R9",
            "123#R08",
            "123#R1x",
            "123##",
            "123##2AA",
            "123##3",
            "123##1A",
            "123#01#02",
        ] {
            assert!(frame_spec(rejected).is_err(), "{rejected:?}");
        }
    }

    #[test]
    fn identifiers_accept_an_optional_prefix() {
        assert_eq!(hex_u32("123"), Ok(0x123));
        assert_eq!(hex_u32("0x123"), Ok(0x123));
        assert_eq!(hex_u32("0X1fffFFFF"), Ok(0x1fff_ffff));
        for rejected in [
            "",
            "0x",
            "0x0x1",
            "+12",
            "-1",
            " 12",
            "12 ",
            "12g",
            "1ffffffff",
        ] {
            assert!(hex_u32(rejected).is_err(), "{rejected:?}");
        }
    }

    #[test]
    fn payloads_accept_separators_between_whole_bytes() {
        assert_eq!(payload_hex("").as_deref(), Ok(""));
        assert_eq!(payload_hex("01020304").as_deref(), Ok("01020304"));
        assert_eq!(payload_hex("01 02 03 04").as_deref(), Ok("01020304"));
        assert_eq!(payload_hex("de:ad-BE.ef").as_deref(), Ok("deadBEef"));
        assert_eq!(payload_hex("0102 0304").as_deref(), Ok("01020304"));
        for rejected in ["1", "1 23", "012", "0x01", "zz", "01,02"] {
            assert!(payload_hex(rejected).is_err(), "{rejected:?}");
        }
    }
}
