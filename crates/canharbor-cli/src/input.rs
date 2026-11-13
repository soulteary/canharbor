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

#[cfg(test)]
mod tests {
    use super::*;

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
