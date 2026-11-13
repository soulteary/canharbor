// SPDX-License-Identifier: AGPL-3.0-or-later
//! Signal decoding from a DBC subset. Presentation only: nothing here selects,
//! filters or transmits frames.
//!
//! Supported: `BO_` messages, `SG_` signals with either byte order, signed and
//! unsigned integers, IEEE floats declared by `SIG_VALTYPE_`, linear scaling,
//! units, and simple multiplexing (`M` selector with `m<N>` signals).
//!
//! Not interpreted: value tables, attributes, comments, signal groups and
//! extended multiplexing. A file that uses extended multiplexing
//! (`SG_MUL_VAL_` or an `m<N>M` signal) is rejected, because decoding it with
//! the simple rules would report wrong values.
use std::collections::HashMap;

const MAX_BYTES: usize = 16 * 1024 * 1024;
const MAX_SIGNALS: usize = 200_000;

#[derive(Debug, Clone, PartialEq)]
pub enum Error {
    TooLarge,
    Line { line: usize, reason: &'static str },
    Unsupported { line: usize, reason: &'static str },
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TooLarge => write!(f, "DBC file exceeds the 16 MiB or signal-count limit"),
            Self::Line { line, reason } => write!(f, "DBC line {line}: {reason}"),
            Self::Unsupported { line, reason } => {
                write!(f, "DBC line {line}: unsupported: {reason}")
            }
        }
    }
}
impl std::error::Error for Error {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Kind {
    Unsigned,
    Signed,
    Float,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Mux {
    None,
    Selector,
    Selected(u64),
}
#[derive(Debug, Clone)]
struct Signal {
    name: String,
    start: u16,
    length: u8,
    little_endian: bool,
    kind: Kind,
    factor: f64,
    offset: f64,
    unit: String,
    mux: Mux,
}
#[derive(Debug, Clone)]
struct Message {
    name: String,
    signals: Vec<Signal>,
}
/// A decoded physical value. Integers without scaling stay exact.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Value {
    Unsigned(u64),
    Signed(i64),
    Float(f64),
}
impl std::fmt::Display for Value {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Unsigned(v) => write!(f, "{v}"),
            Self::Signed(v) => write!(f, "{v}"),
            Self::Float(v) => write!(f, "{v}"),
        }
    }
}
#[derive(Debug, Clone, PartialEq)]
pub struct Decoded<'a> {
    pub name: &'a str,
    pub value: Value,
    pub unit: &'a str,
}
#[derive(Debug, Clone, PartialEq)]
pub struct DecodedMessage<'a> {
    pub name: &'a str,
    pub signals: Vec<Decoded<'a>>,
    /// Signals whose bits lie beyond the received payload.
    pub truncated: usize,
}
#[derive(Debug, Default)]
pub struct Database {
    messages: HashMap<(u32, bool), Message>,
}

/// Windows-1252 differs from Latin-1 only in 0x80..=0x9F. The five bytes it
/// leaves undefined map to the control characters of the same value.
fn windows_1252(byte: u8) -> char {
    const HIGH: [u16; 32] = [
        0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039,
        0x152, 0x8d, 0x17d, 0x8f, 0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
        0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
    ];
    match byte {
        0x80..=0x9f => char::from_u32(u32::from(HIGH[usize::from(byte - 0x80)])).unwrap_or('?'),
        _ => char::from(byte),
    }
}

fn raw_bits(data: &[u8], signal: &Signal) -> Option<u64> {
    let mut raw = 0u64;
    if signal.little_endian {
        // The start bit is the least significant bit; bit n is bit n%8 of byte n/8.
        for i in 0..u16::from(signal.length) {
            let bit = signal.start + i;
            let byte = *data.get(usize::from(bit / 8))?;
            raw |= u64::from(byte >> (bit % 8) & 1) << i;
        }
    } else {
        // The start bit is the most significant bit. Within a byte the next
        // bit is one lower; after bit 0 it continues at bit 7 of the next byte.
        let mut bit = signal.start;
        for _ in 0..signal.length {
            let byte = *data.get(usize::from(bit / 8))?;
            raw = raw << 1 | u64::from(byte >> (bit % 8) & 1);
            bit = if bit.is_multiple_of(8) {
                bit + 15
            } else {
                bit - 1
            };
        }
    }
    Some(raw)
}

fn physical(raw: u64, signal: &Signal) -> Value {
    let scaled = signal.factor != 1.0 || signal.offset != 0.0;
    match signal.kind {
        Kind::Float => {
            let value = if signal.length == 32 {
                f64::from(f32::from_bits(raw as u32))
            } else {
                f64::from_bits(raw)
            };
            Value::Float(value * signal.factor + signal.offset)
        }
        Kind::Unsigned if scaled => Value::Float(raw as f64 * signal.factor + signal.offset),
        Kind::Unsigned => Value::Unsigned(raw),
        Kind::Signed => {
            let shift = 64 - u32::from(signal.length);
            let value = (raw << shift) as i64 >> shift;
            if scaled {
                Value::Float(value as f64 * signal.factor + signal.offset)
            } else {
                Value::Signed(value)
            }
        }
    }
}

impl Database {
    pub fn parse(bytes: &[u8]) -> Result<Self, Error> {
        if bytes.len() > MAX_BYTES {
            return Err(Error::TooLarge);
        }
        // Names and numbers are ASCII, but units and comments are often
        // Windows-1252. Valid UTF-8 is taken as such; anything else is read as
        // Windows-1252 so that a unit like "\u{b0}C" is not turned into U+FFFD.
        let text = match std::str::from_utf8(bytes) {
            Ok(text) => std::borrow::Cow::Borrowed(text),
            Err(_) => {
                std::borrow::Cow::Owned(bytes.iter().map(|byte| windows_1252(*byte)).collect())
            }
        };
        let mut database = Self::default();
        let mut current: Option<(u32, bool)> = None;
        let mut floats: Vec<(usize, (u32, bool), String, u8)> = Vec::new();
        let mut signals = 0usize;
        // Comments and attribute strings may span lines and contain text that
        // looks like a record; skip everything inside an open string.
        let mut in_string = false;
        // The `NS_ :` header lists record keywords, one bare word per line.
        // Those are names, not records.
        let mut in_namespace = false;
        for (index, line) in text.lines().enumerate() {
            let number = index + 1;
            // A quote is escaped only by an odd number of preceding backslashes.
            let mut quotes = 0usize;
            let mut backslashes = 0usize;
            for byte in line.bytes() {
                if byte == b'"' && backslashes.is_multiple_of(2) {
                    quotes += 1;
                }
                backslashes = if byte == b'\\' { backslashes + 1 } else { 0 };
            }
            let continued = in_string;
            if !quotes.is_multiple_of(2) {
                in_string = !in_string;
            }
            if continued {
                continue;
            }
            let bad = |reason| Error::Line {
                line: number,
                reason,
            };
            // Records are a keyword followed by any whitespace, not only a space.
            let line = line.trim();
            let keyword = line.split_whitespace().next().unwrap_or_default();
            let rest = line[keyword.len()..].trim_start();
            if in_namespace && !keyword.is_empty() && rest.is_empty() {
                continue;
            }
            in_namespace = keyword == "NS_" || keyword == "NS_:";
            if in_namespace {
                continue;
            }
            if keyword == "BO_" {
                let mut fields = rest.split_whitespace();
                let raw = fields
                    .next()
                    .and_then(|id| id.parse::<u32>().ok())
                    .ok_or(bad("message identifier"))?;
                // The colon may follow the name directly or after whitespace.
                let name = fields
                    .next()
                    .map(|name| name.strip_suffix(':').unwrap_or(name))
                    .filter(|name| !name.is_empty() && !name.contains(':'))
                    .ok_or(bad("message name"))?;
                let extended = raw & 0x8000_0000 != 0;
                let id = raw & 0x1fff_ffff;
                if raw & 0x6000_0000 != 0 || (!extended && id > 0x7ff) {
                    // Includes the 0xC0000000 pseudo-message for unassigned signals.
                    current = None;
                    continue;
                }
                database.messages.insert(
                    (id, extended),
                    Message {
                        name: name.to_owned(),
                        signals: Vec::new(),
                    },
                );
                current = Some((id, extended));
            } else if keyword == "SG_" {
                let Some(key) = current else { continue };
                signals += 1;
                if signals > MAX_SIGNALS {
                    return Err(Error::TooLarge);
                }
                let (head, layout) = rest.split_once(':').ok_or(bad("signal definition"))?;
                let mut head = head.split_whitespace();
                let name = head.next().ok_or(bad("signal name"))?;
                let mux = match head.next() {
                    None => Mux::None,
                    Some("M") => Mux::Selector,
                    Some(tag) => {
                        let value = tag.strip_prefix('m').ok_or(bad("multiplexer tag"))?;
                        if value.ends_with('M') {
                            return Err(Error::Unsupported {
                                line: number,
                                reason: "extended multiplexing",
                            });
                        }
                        Mux::Selected(value.parse().map_err(|_| bad("multiplexer value"))?)
                    }
                };
                let layout = layout.trim_start();
                let (bits, rest) = layout
                    .split_once(char::is_whitespace)
                    .ok_or(bad("signal layout"))?;
                let (position, order) = bits.split_once('@').ok_or(bad("signal layout"))?;
                let (start, length) = position.split_once('|').ok_or(bad("signal layout"))?;
                let start = start.parse::<u16>().map_err(|_| bad("start bit"))?;
                let length = length.parse::<u8>().map_err(|_| bad("signal length"))?;
                if length == 0 || length > 64 || start >= 512 {
                    return Err(bad("signal position outside 1..=64 bits or 64 bytes"));
                }
                let (little_endian, signed) = match order {
                    "1+" => (true, false),
                    "1-" => (true, true),
                    "0+" => (false, false),
                    "0-" => (false, true),
                    _ => return Err(bad("byte order or sign")),
                };
                let scale = rest
                    .trim_start()
                    .strip_prefix('(')
                    .and_then(|rest| rest.split_once(')'))
                    .ok_or(bad("factor and offset"))?;
                let (factor, offset) = scale.0.split_once(',').ok_or(bad("factor and offset"))?;
                let factor = factor.trim().parse::<f64>().map_err(|_| bad("factor"))?;
                let offset = offset.trim().parse::<f64>().map_err(|_| bad("offset"))?;
                if !factor.is_finite() || !offset.is_finite() {
                    return Err(bad("factor or offset is not finite"));
                }
                let unit = scale.1.split('"').nth(1).ok_or(bad("unit"))?.to_owned();
                database
                    .messages
                    .get_mut(&key)
                    .expect("current message exists")
                    .signals
                    .push(Signal {
                        name: name.to_owned(),
                        start,
                        length,
                        little_endian,
                        kind: if signed { Kind::Signed } else { Kind::Unsigned },
                        factor,
                        offset,
                        unit,
                        mux,
                    });
            } else if keyword == "SIG_VALTYPE_" {
                let mut fields = rest
                    .split(|c: char| c.is_whitespace() || c == ':' || c == ';')
                    .filter(|field| !field.is_empty());
                let raw = fields
                    .next()
                    .and_then(|id| id.parse::<u32>().ok())
                    .ok_or(bad("value type message"))?;
                let name = fields.next().ok_or(bad("value type signal"))?;
                let kind = fields
                    .next()
                    .and_then(|kind| kind.parse::<u8>().ok())
                    .ok_or(bad("value type"))?;
                floats.push((
                    number,
                    (raw & 0x1fff_ffff, raw & 0x8000_0000 != 0),
                    name.to_owned(),
                    kind,
                ));
            } else if keyword == "SG_MUL_VAL_" {
                return Err(Error::Unsupported {
                    line: number,
                    reason: "extended multiplexing",
                });
            } else if !keyword.is_empty() && keyword != "CM_" {
                // Any other record ends the signal list of the current message.
                current = None;
            }
        }
        for (line, key, name, kind) in floats {
            let Some(signal) = database
                .messages
                .get_mut(&key)
                .and_then(|m| m.signals.iter_mut().find(|s| s.name == name))
            else {
                continue;
            };
            match (kind, signal.length) {
                (0, _) => {}
                (1, 32) | (2, 64) => signal.kind = Kind::Float,
                _ => {
                    return Err(Error::Line {
                        line,
                        reason: "float value type does not match the signal length",
                    });
                }
            }
        }
        for message in database.messages.values() {
            if message
                .signals
                .iter()
                .filter(|s| s.mux == Mux::Selector)
                .count()
                > 1
            {
                return Err(Error::Unsupported {
                    line: 0,
                    reason: "several multiplexer selectors in one message",
                });
            }
        }
        Ok(database)
    }

    pub fn messages(&self) -> usize {
        self.messages.len()
    }

    /// Decode the signals of the message with this identifier, in file order.
    /// Returns `None` when the database has no such message.
    pub fn decode(&self, id: u32, extended: bool, data: &[u8]) -> Option<DecodedMessage<'_>> {
        let message = self.messages.get(&(id, extended))?;
        let selector = message
            .signals
            .iter()
            .find(|signal| signal.mux == Mux::Selector)
            .and_then(|signal| raw_bits(data, signal));
        let mut decoded = DecodedMessage {
            name: &message.name,
            signals: Vec::new(),
            truncated: 0,
        };
        for signal in &message.signals {
            if let Mux::Selected(value) = signal.mux {
                // Without a readable selector the active branch is unknown.
                if selector != Some(value) {
                    continue;
                }
            }
            match raw_bits(data, signal) {
                Some(raw) => decoded.signals.push(Decoded {
                    name: &signal.name,
                    value: physical(raw, signal),
                    unit: &signal.unit,
                }),
                None => decoded.truncated += 1,
            }
        }
        Some(decoded)
    }
}
