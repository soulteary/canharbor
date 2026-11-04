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

## Serial command engine

`Serial::open` requires an explicit tty path and UART baud rate. It opens without
following symlinks, requests tty exclusivity and a cooperative file lock, sets raw
8N1 mode, and restores the previous termios on drop. Reads use bounded polling;
writes are nonblocking single attempts. No EEPROM settings are changed.

`Engine` performs a version handshake before configuration. Start serializes
close, bitrate, and the requested active/listen-only command, checking control
before each mutating write. Listen-only rejection never falls back to active.
Streaming and single-frame polling are explicit profiles. Interleaved received
frames remain in a bounded queue while command replies are processed.

Command replies have a 250 ms deadline. A short write or missing reply poisons the
engine and requires an explicit reopen. It does not retry or append a cleanup CR:
a terminator could complete a partially written transmit record. Consequently a
poisoned engine cannot promise to close the hardware controller. Callers must
report the cleanup failure and retain unknown transmission counts. Firmware
acceptance resolves command uncertainty, not remote bus delivery.

Tests use scripted fragmented transports and Unix pseudo-terminals. They verify
raw serial I/O, bounded reads, exclusive ownership, rejected paths, command order,
interleaved RX, control revocation, listen-only rejection, short writes, and lost
replies. This remains a blocking engine; registration as a service backend is a
separate increment. Hardware behavior is unverified.

## Service backend

Build the CLI with the independent `slcan` feature, then opt in explicitly:

```sh
cargo build -p canharbor-cli --features web-ui,slcan
canharbor serve --slcan /dev/cu.EXPLICIT_DEVICE --serial-baud 115200
# For firmware configured for single-frame polling:
canharbor serve --slcan /dev/cu.EXPLICIT_DEVICE --serial-baud 57600 --slcan-polling
```

No serial ports are enumerated or probed automatically. One worker owns the
transport, with 32 queued requests and a 256-event bounded publication ring.
Configure/start/stop/close and transmit use the same runtime lease checks as other
backends. Start and transmit also check revocation immediately before each write;
cancelled queued requests are skipped. Shutdown bypasses the command queue, joins
the worker, and retains cleanup failures and unknown transmission counts.

The service advertises Classic CAN only and marks hardware compatibility
unverified. Its normal CLI and Web session controls work through the existing
registry. Device IDs identify an open epoch; disconnect or poisoned transport
requires an explicit reopen and never resumes a lease or transmission. The
current startup registration requires restarting the service to reopen.

Raw device timestamp milliseconds are converted to raw microseconds without
clock extension or host mapping. Status flags are retained as raw diagnostic data;
receive FIFO overflow and data overrun fault the acquisition. Firmware TX command
acceptance returns backend submission, without synthesizing a TX echo or claiming
bus acknowledgement. UART framing, firmware configuration, and bus wiring still
require future hardware validation.
