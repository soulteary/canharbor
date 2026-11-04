# Kvaser backend

The optional `kvaser` CLI feature connects the existing service, CLI and Web UI
to the open-source **libKvaserUSB 1.0.2** C API. This is not Kvaser's closed-source
CANlib. CANHarbor neither bundles a driver binary nor installs a replacement
system library. Only synthetic C libraries have been tested. Adapter firmware,
physical bus behavior and macOS signing/notarization remain unverified.

```sh
cargo build -p canharbor-cli --features kvaser,web-ui
canharbor kvaser-list --library /absolute/path/libKvaserUSB.dylib
canharbor serve --kvaser-library /absolute/path/libKvaserUSB.dylib \
  --kvaser-channel 0x10200
```

Use handles actually returned by discovery. Multiple explicit `--kvaser-channel`
options select channels; library and channel options require one another. A
handle encodes the driver's USB location and channel, not a persistent physical
identity. Serial zero means unknown. Channel IDs include a service epoch.
Discovery does not open controllers. A session and explicit acquisition/start
are still required. Opening a native library executes trusted native code; the
path is available only at CLI startup, never through HTTP. The process-resident
loader bounds distinct images and reserves channel handles across aliases.

The shared native worker owns all calls and close operations. It checks the
current permit before each adapter-controlled API call. The foreign `kv_open`
transaction can contain several USB operations and cannot be preempted by Rust;
a revoked startup is closed when the call returns. Setup/teardown bounds depend
on the selected native implementation. Cancellation never retries a write.
Failed starts are cleaned up on the same worker. Only successfully owned handles
are closed; no reset, periodic firmware transmit or automatic bus-off restart
is requested. `kv_close` returns void, so a returned cleanup result does not prove
that the device acknowledged physical bus-off.

Classic profiles expose nominal rates 10/20/50/100/125/250/500/800/1000 kbit/s.
FD-capable channels additionally expose data rates 1/2/4/8 Mbit/s. Requests use
80 percent sample point and the driver's automatic timing calculation. Nominal
rate is checked through `kv_get_busparams`. Hydra firmware mode readback must
match the requested mode; FD requires that readback and a reported FD capability.
Classic Leaf/Helios drivers return unsupported for mode readback and may echo
requested bus parameters. They receive the explicit listen-only option without
an active fallback. The public API does not expose actual FD data timing or a
uniform hardware clock readback. These profiles and capabilities are driver
contracts, not measured hardware timing or verification of silent operation.

RX validates identifiers, flags, DLC and payload length. RTR writes set both
`dlc` and `len` because the Leaf encoder uses `len` for RTR DLC. Error/status
records use the diagnostic stream, never the data stream. Raw error counters and
status payload are retained. A reported bus-off faults acquisition. Timestamp
values are driver-reported microseconds with uncertain quality, no host-clock
mapping, and a new epoch after a backwards value. The upstream internal receive
queue has no public loss counter; this adapter cannot prove that its captures
contain every physical bus frame.

A successful write means `backend_submitted`. SDK echo records lack application
request IDs and remain diagnostics. Firmware TX credit counts are not used to
assert per-request delivery: Classic and Hydra account for credits differently.
Stop conservatively reports every accepted write, plus ambiguous I/O failures,
as an unconfirmed transmission, and retires that count once. Queue-full and
known pre-submission rejections are not counted or retried. The counter stores
no frame payloads and does not introduce an artificial lifetime transmit window.

Tests compile an owned synthetic C library against the retained upstream header.
They check sizes/offsets, discovery and exclusive claims, all FD lengths, RTR,
configuration mismatch and unsupported Classic readback, revoked writes,
unknown outcomes, diagnostic isolation, bus-off, two-channel worker routing and
a real CLI/service flow. They do not execute native USB driver code.

The retained header and adapted ABI declarations use the upstream BSD-3-Clause
option. Original adapter code remains AGPL-3.0-or-later. See
[kvaser-provenance.json](kvaser-provenance.json), `THIRD_PARTY_NOTICES` and the
retained upstream license for copyright, conditions and disclaimer.
