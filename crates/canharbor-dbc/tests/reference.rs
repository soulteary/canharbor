// SPDX-License-Identifier: AGPL-3.0-or-later
//! `reference.dbc` and `reference.txt` were generated for this project: random
//! signal layouts and payloads, with the expected values computed by cantools
//! 45.1.2. Each line of the text file is `ID EXTENDED PAYLOAD name=value;...`.
use canharbor_dbc::{Database, Error, Value};

fn number(value: Value) -> f64 {
    match value {
        Value::Unsigned(v) => v as f64,
        Value::Signed(v) => v as f64,
        Value::Float(v) => v,
    }
}
#[test]
fn decoding_matches_the_reference_implementation() {
    let database = Database::parse(include_bytes!("reference.dbc")).unwrap();
    // The comment in the file contains text shaped like a message definition.
    assert!(database.decode(999, false, &[0; 8]).is_none());
    let mut compared = 0;
    for line in include_str!("reference.txt").lines() {
        let mut fields = line.splitn(4, ' ');
        let id = u32::from_str_radix(fields.next().unwrap(), 16).unwrap();
        let extended = fields.next().unwrap() == "1";
        let payload = fields.next().unwrap();
        let data: Vec<u8> = (0..payload.len() / 2)
            .map(|i| u8::from_str_radix(&payload[2 * i..2 * i + 2], 16).unwrap())
            .collect();
        let decoded = database.decode(id, extended, &data).expect(line);
        assert_eq!(decoded.truncated, 0, "{line}");
        let expected: Vec<(&str, f64)> = fields
            .next()
            .unwrap()
            .split(';')
            .map(|pair| {
                let (name, value) = pair.split_once('=').unwrap();
                (name, value.parse().unwrap())
            })
            .collect();
        assert_eq!(decoded.signals.len(), expected.len(), "{line}");
        for (name, value) in expected {
            let signal = decoded
                .signals
                .iter()
                .find(|signal| signal.name == name)
                .unwrap_or_else(|| panic!("{name} missing in {line}"));
            let actual = number(signal.value);
            let same = if value.is_nan() {
                actual.is_nan()
            } else if value.is_infinite() {
                actual == value
            } else {
                (actual - value).abs() <= value.abs().max(1.0) * 1e-12
            };
            assert!(same, "{name}: {actual} != {value} in {line}");
            compared += 1;
        }
    }
    assert!(compared > 2500, "{compared}");
}
#[test]
fn unscaled_integers_stay_exact_and_units_are_kept() {
    let database = Database::parse(
        b"BO_ 291 Engine: 8 ECU\n SG_ Counter : 0|64@1+ (1,0) [0|0] \"\" X\n\
          BO_ 2147483939 Ext: 2 ECU\n SG_ Temp : 7|16@0- (0.5,-40) [0|0] \"degC\" X\n",
    )
    .unwrap();
    assert_eq!(database.messages(), 2);
    let engine = database.decode(0x123, false, &[0xff; 8]).unwrap();
    assert_eq!(engine.name, "Engine");
    assert_eq!(engine.signals[0].value, Value::Unsigned(u64::MAX));
    // The same number is a different message when the identifier width differs.
    assert!(database.decode(0x123, true, &[0xff; 8]).is_some());
    assert!(database.decode(0x124, false, &[0xff; 8]).is_none());
    let ext = database.decode(0x123, true, &[0xff, 0xfe]).unwrap();
    assert_eq!(ext.signals[0].value, Value::Float(-41.0));
    assert_eq!(ext.signals[0].unit, "degC");
    assert_eq!(ext.signals[0].value.to_string(), "-41");
}
#[test]
fn short_payloads_and_unknown_selectors_do_not_produce_values() {
    let database = Database::parse(
        b"BO_ 1 M: 8 ECU\n SG_ Sel M : 0|8@1+ (1,0) [0|0] \"\" X\n\
          \x20SG_ A m0 : 8|8@1+ (1,0) [0|0] \"\" X\n SG_ B m1 : 56|8@1+ (1,0) [0|0] \"\" X\n",
    )
    .unwrap();
    let names = |data: &[u8]| -> (Vec<String>, usize) {
        let decoded = database.decode(1, false, data).unwrap();
        (
            decoded.signals.iter().map(|s| s.name.to_owned()).collect(),
            decoded.truncated,
        )
    };
    assert_eq!(
        names(&[0, 7, 0, 0, 0, 0, 0, 9]),
        (vec!["Sel".into(), "A".into()], 0)
    );
    assert_eq!(
        names(&[1, 7, 0, 0, 0, 0, 0, 9]),
        (vec!["Sel".into(), "B".into()], 0)
    );
    assert_eq!(names(&[5, 7, 0, 0, 0, 0, 0, 9]), (vec!["Sel".into()], 0));
    // B lies beyond a two-byte payload: reported as truncated, not as zero.
    assert_eq!(names(&[1, 7]), (vec!["Sel".into()], 1));
    assert_eq!(names(&[]), (vec![], 1));
}
#[test]
fn records_are_recognised_with_any_whitespace_and_escaped_quotes() {
    // Tabs instead of spaces, a colon separated from the message name, and a
    // comment whose text ends in an escaped backslash before the closing quote.
    let database = Database::parse(
        b"CM_ \"C:\\\\logs\\\\\";\nBO_\t291\tEngine :\t8 ECU\n\tSG_\tRatio\t:\t0|32@1+\t(1,0)\t[0|0]\t\"\"\tX\n\
          SIG_VALTYPE_\t291\tRatio\t:\t1;\n",
    )
    .unwrap();
    let decoded = database
        .decode(0x123, false, &1.0f32.to_le_bytes())
        .expect("the message after the comment is read");
    assert_eq!(decoded.name, "Engine");
    assert_eq!(decoded.signals[0].value, Value::Float(1.0));
    // An escaped quote keeps a string open; the record-shaped text inside is skipped.
    let database =
        Database::parse(b"CM_ \"say \\\"hi\\\"\nBO_ 5 Fake: 8 ECU\n\";\nBO_ 6 Real: 8 ECU\n")
            .unwrap();
    assert!(database.decode(5, false, &[]).is_none());
    assert!(database.decode(6, false, &[]).is_some());
    assert!(matches!(
        Database::parse(b"BO_ 1 M: 8 E\nSG_MUL_VAL_\t1 A B 1-1;\n"),
        Err(Error::Unsupported { .. })
    ));
}
#[test]
fn namespace_entries_are_not_records() {
    // The header names record types, including two this parser acts on.
    let database = Database::parse(
        b"VERSION \"\"\n\nNS_ :\n\tCM_\n\tSIG_VALTYPE_\n\tSG_MUL_VAL_\n\tBO_TX_BU_\nBS_:\n\nBU_: ECU\n\
          BO_ 7 M: 8 ECU\n SG_ S : 0|8@1+ (1,0) [0|0] \"\" X\n",
    )
    .unwrap();
    assert_eq!(
        database.decode(7, false, &[9]).unwrap().signals[0].value,
        Value::Unsigned(9)
    );
    // Blank and whitespace-only lines inside the header do not end it.
    let database = Database::parse(
        b"NS_ :\n\n\tSIG_VALTYPE_\n \t \n\tSG_MUL_VAL_\n\nBS_:\nBO_ 7 M: 8 ECU\n SG_ S : 0|8@1+ (1,0) [0|0] \"\" X\n",
    )
    .unwrap();
    assert!(database.decode(7, false, &[9]).is_some());
    // Outside the header a real extended-multiplexing record is still refused.
    assert!(matches!(
        Database::parse(b"NS_ :\n\tSG_MUL_VAL_\n\nBO_ 1 M: 8 E\nSG_MUL_VAL_ 1 A B 1-1;\n"),
        Err(Error::Unsupported { .. })
    ));
}
#[test]
fn units_keep_their_characters_in_utf8_and_windows_1252_files() {
    let unit = |file: &[u8]| {
        let database = Database::parse(file).unwrap();
        database.decode(1, false, &[0]).unwrap().signals[0]
            .unit
            .to_owned()
    };
    let signal = |unit: &[u8]| {
        [
            b"BO_ 1 M: 8 E\n SG_ S : 0|8@1+ (1,0) [0|0] \"",
            unit,
            b"\" X\n",
        ]
        .concat()
    };
    // Windows-1252: degree sign, micro sign, euro sign.
    assert_eq!(unit(&signal(b"\xb0C")), "\u{b0}C");
    assert_eq!(unit(&signal(b"\xb5s")), "\u{b5}s");
    assert_eq!(unit(&signal(b"\x80")), "\u{20ac}");
    // Escaped characters inside the unit: an inch mark and a backslash.
    assert_eq!(unit(&signal(b"\\\"")), "\"");
    assert_eq!(unit(&signal(b"a\\\\b")), "a\\b");
    assert!(Database::parse(&signal(b"open\\")).is_err());
    // The same characters in UTF-8 are not decoded a second time.
    assert_eq!(
        unit(&signal("\u{b0}C \u{20ac}".as_bytes())),
        "\u{b0}C \u{20ac}"
    );
}
#[test]
fn malformed_and_unsupported_files_are_rejected() {
    for (text, unsupported) in [
        ("BO_ x M: 8 E\n", false),
        ("BO_ 1 M: 8 E\n SG_ S : 0|0@1+ (1,0) [0|0] \"\" X\n", false),
        ("BO_ 1 M: 8 E\n SG_ S : 0|65@1+ (1,0) [0|0] \"\" X\n", false),
        ("BO_ 1 M: 8 E\n SG_ S : 0|8@2+ (1,0) [0|0] \"\" X\n", false),
        (
            "BO_ 1 M: 8 E\n SG_ S : 0|8@1+ (nan,0) [0|0] \"\" X\n",
            false,
        ),
        ("BO_ 1 M: 8 E\n SG_ S : 0|8@1+ (1,0) [0|0] X\n", false),
        (
            "BO_ 1 M: 8 E\n SG_ S : 0|16@1+ (1,0) [0|0] \"\" X\nSIG_VALTYPE_ 1 S : 1;\n",
            false,
        ),
        (
            "BO_ 1 M: 8 E\n SG_ S m1M : 0|8@1+ (1,0) [0|0] \"\" X\n",
            true,
        ),
        ("BO_ 1 M: 8 E\nSG_MUL_VAL_ 1 A B 1-1;\n", true),
        (
            "BO_ 1 M: 8 E\n SG_ A M : 0|8@1+ (1,0) [0|0] \"\" X\n SG_ B M : 8|8@1+ (1,0) [0|0] \"\" X\n",
            true,
        ),
    ] {
        let error = Database::parse(text.as_bytes()).unwrap_err();
        assert_eq!(
            matches!(error, Error::Unsupported { .. }),
            unsupported,
            "{text}"
        );
    }
    assert!(
        Database::parse(b"")
            .unwrap()
            .decode(1, false, &[])
            .is_none()
    );
}
