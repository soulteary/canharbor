# SLCAN implementation

The protocol crate implements Classic CAN data/RTR framing for standard and
extended identifiers. It rejects FD extensions and malformed lengths. Timestamp
values are retained as raw milliseconds modulo 60000; they are not host time.
The incremental decoder bounds each line and recovers at CR or BEL after invalid
input. Firmware command acceptance is separate from CAN bus acknowledgement.

Protocol facts were checked against the [LAWICEL CAN232 3.0B manual](https://www.canusb.com/files/can232_v3.pdf).
This is an independent implementation with synthetic tests; no manual text,
upstream driver implementation, firmware, or vendor binary is included. CAN232,
CANUSB, and third-party SLCAN devices can differ in polling, timestamps, and
command support. Hardware and firmware compatibility remain unverified.

This increment provides the codec, not a registered serial backend. Serial
transport, command sequencing, cancellation, and runtime integration follow
separately. No device is automatically probed or opened.
