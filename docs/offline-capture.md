# Offline capture inspection

`canharbor capture inspect capture.ndjson --limit 100` reads a local recording
without contacting the service, acquiring control or opening a device. It
returns a JSON summary and the last requested events, limited to 500.

The reader scans one bounded line at a time: 8192 bytes per record and 64 MiB
per file. It validates record order, schema version, counters, footer counts,
frame invariants, raw DLC and ESI metadata, diagnostic bytes, event sequence and
monotonic timestamp order. Partial final records are excluded; complete valid
prefixes remain inspectable as incomplete. Malformed complete records are
rejected. No incomplete recording is silently labeled complete.

Preview entries retain received/transmitted direction, raw DLC, timestamp
quality and epoch, hardware counters, ESI and diagnostics. Diagnostics are
counted separately from frames. Inspection does not turn observed traffic into
a transmit plan or discard metadata to make a frame sendable. Active replay
requires a separate explicit operation and policy.

The shared synthetic capture corpus covers Classic raw DLC, CAN FD BRS/ESI,
64-bit precision, diagnostics, recoverable prefixes and invalid frames. Tests
also use a three-byte reader, verify bounded previews over 1000 events, and
invoke the CLI with no service running. Hardware was not used.
