# DBC signal decoding

`canharbor monitor --format text --dbc vehicle.dbc` appends decoded signal
values to each frame the file describes:

```text
     1.536481 RX      123 [ 3] C8 00 3C  Engine: Speed=100 km/h, Temp=20 degC
     1.544260 RX      124 [ 3] C8 00 3C
```

Decoding happens in the CLI process and is presentation only. It does not
change the subscription, the JSON output, recordings or anything that is
transmitted. Frames without a matching message are printed unchanged. Standard
and extended identifiers with the same number are different messages.

## Supported subset

- `BO_` messages and `SG_` signals in either byte order, signed or unsigned,
  1 to 64 bits, within the first 64 bytes.
- 32-bit and 64-bit IEEE floats declared with `SIG_VALTYPE_`.
- Linear scaling (`factor`, `offset`) and units. Integers with factor 1 and
  offset 0 are printed exactly; scaled values are printed as 64-bit floats.
- Simple multiplexing: one `M` selector per message with `m<N>` signals. A
  multiplexed signal is shown only when the selector equals its value.

Value tables (`VAL_`), attributes, comments, signal groups and minimum/maximum
ranges are read past and not used. Files that use extended multiplexing
(`SG_MUL_VAL_` or `m<N>M` signals) are rejected: decoding them with the simple
rules would print wrong values. A malformed signal definition is also an error,
reported with its line number. Files larger than 16 MiB are refused.

A signal whose bits lie beyond the received payload is not printed; the line
ends with the number of such signals instead of showing a value of zero. Remote
frames carry no data and are never decoded. Names and units are printed with
control characters replaced.

## Verification

The decoder is compared against cantools 45.1.2 in
`crates/canharbor-dbc/tests/reference.rs`: 421 generated messages covering both
byte orders, signed and unsigned integers from 1 to 64 bits (61 of the 64 lengths occur),
floats, scaling, standard and extended identifiers and classic and CAN FD
lengths, with six random payloads each. The reference files were generated for
this project and contain no third-party database. No vendor DBC file or
physical bus was used.
