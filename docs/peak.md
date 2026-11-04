# Optional PEAK adapter

The `peak` CLI feature integrates the open-source **libPeakUSB 1.0.2** C API
through `canharbor-peak` and the shared native driver worker. The supported source
snapshot is recorded in [peak-provenance.json](peak-provenance.json). No vendor
binary is bundled, downloaded at runtime, or installed over a system library.
The adapter implements a PCAN-Basic subset; it does not export a replacement
PCAN-Basic dylib or claim compatibility with every application using that API.

## Build and explicit selection

Build a compliant libPeakUSB from the referenced source separately. Its own build
requires libusb. Then build the CLI and select the library and handles explicitly:

```sh
cargo build -p canharbor-cli --features web-ui,peak
canharbor peak-list --library /absolute/path/libPeakUSB.1.dylib
canharbor serve --peak-library /absolute/path/libPeakUSB.1.dylib \
  --peak-channel 0x51 --peak-channel 0x52
```

Handles require a `0x` prefix. Discovery reads descriptors without initializing
controllers. The service then uses its ordinary devices, capabilities, session,
CLI, capture, and Web interfaces. Classic and ISO FD operation are explicit.
Nominal rates are the standard exact-rate BTR profiles; FD data rates are
1/2/4/5/8 Mbit/s, subject to device capability. FD timing strings are calculated
for the library's 80 MHz API profile without silently approximating bitrates.

Library paths are startup-only native-code configuration. The image and its
native dependencies must be trusted implementations of the documented ABI.
The HTTP API accepts neither library paths nor arbitrary symbols. The loader pins
at most 16 canonical paths for the process lifetime, shares aliases by filesystem
identity, and reserves selected channel handles before any configuration writes.
A library image is not replaced in a running process after an on-disk rebuild.
These rules prevent adapters in this process from configuring the same handle;
they do not sandbox foreign code.

## Behavior and limits

One worker owns the selected channels and library API calls. Each start validates
configuration before I/O, sets listen-only and disables automatic bus-off reset,
initializes the selected mode, and checks driver-reported mode/bitrate values.
Rejection never falls back to active mode. Execution-time guards apply to each
mutating call. Cleanup targets only handles opened by this adapter; it never uses
the all-channels uninitialize value or an automatic controller reset/restart.

Read data is validated before constructing CAN frames. Error and status messages
are diagnostics. Diagnostic `raw_classes` uses bits 30/31 for native ERROR/STATUS
categories and the remaining bits for the native message ID/status value; native
payload bytes occupy `raw_data_hex`. Receive overflow terminates acquisition.
Bus-off diagnostics precede the terminal fault. Capture headers identify the
backend, channel, and open-epoch device ID so offline readers can interpret these
backend-specific fields.

TX success means **backend submission**. Matching driver echo records can be
observed as TX frames but do not provide CAN bus acknowledgement or a
request-correlated delivery guarantee. Unmatched echoes become diagnostics.
Classic adapters without echo support retain an unconfirmed count without keeping
per-frame payloads or imposing an artificial 32-frame lifetime limit. FD adapters
keep a bounded 32-frame echo window. Stop reports unresolved/uncertain submissions
and cleanup failures once. No automatic transmission retry is performed.

The C API normalizes Classic DLC values to payload length. The adapter leaves raw
DLC unavailable in Classic mode rather than claiming the original wire value.
Driver-provided timestamps retain their wide counter and uncertain quality;
there is no host-clock mapping or hardware clock calibration claim.

Device IDs denote an open epoch and selected handles, not verified stable physical
identity. Reopening a faulted startup registration currently requires restarting
the service. Native setup/teardown bounds depend on the selected library; an
arbitrary foreign function that fails to return cannot be forcibly cancelled by
the worker. Hardware, firmware, hotplug, and sleep/wake behavior remain unverified.

## Evidence and licensing

Tests compile a synthetic C library against the retained upstream header. They
compare C/Rust sizes and offsets, exercise Classic/FD/RTR lengths, metadata,
ownership conflicts including file aliases, rejected modes, readback mismatch,
revocation, queue rejection, cleanup failure, status/overflow/bus-off, and unknown
counts. A real service/CLI test discovers two synthetic channels, receives in
listen-only mode, and submits an FD frame. These are software tests, not hardware
compatibility evidence.

The original header and license are retained under `third-party/`. The upstream
GPL-2.0-or-later option is selected under GPLv3 or later for the adapted ABI
module. CANHarbor's own code remains AGPL-3.0-or-later; the GPL and AGPL component
terms remain distinct. Distributors supplying the native library must provide its
required notices and corresponding source as well. See `THIRD_PARTY_NOTICES` and
[licensing.md](licensing.md).
