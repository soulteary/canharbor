# NDJSON capture format and writer

canharbor-capture provides the recording envelope and a bounded writer. Service
control and downloads are a separate increment. No real traffic is bundled.

Files contain one schema_version=1 header, event records wrapping versioned wire
payloads, optional gap records, and a final footer. Header identity includes capture,
owner, service instance, session epoch, creation time and configuration. Event
counters in the envelope are canonical u64 decimal strings. The writer preserves
wire payloads, including frame metadata and diagnostic event variants.

Default limits are 64 queued records, 8192 bytes per line and 64 MiB per file.
Public options have hard maxima. Serialization and queue insertion do not wait
for disk; blocking file writes and finish/join belong on a worker. Each record is
written as a bounded byte slice. There is no user-space buffer that silently retries
a failed partial write during drop. Flush does not claim power-loss durability.

Queue overflow, source loss, invalid events, file-size limits and owner drop make
the file incomplete. Where writing remains possible, a gap and incomplete footer
are emitted. Disk errors stop writing and preserve the prefix; report byte counts
reflect bytes accepted by the sink, and event counts include only full writes.
The writer stops accepting records after a terminal condition. Call finish or drop
the writer to end it; callers must not retry rejected events automatically.

scan reads bounded lines without loading a capture into memory. A partial final
line is ignored and its preceding byte offset returned for prefix recovery.
Complete malformed records, unsupported schema versions, invalid record order,
noncanonical/mismatched counters, trailing content after a footer, and a complete
claim after a gap are rejected. A missing footer is incomplete. Envelope validity
is separate from validating an event against its protocol schema; importers must
do both. A readable complete footer does not establish storage durability.

Tests use in-memory, failing and gated sinks to cover complete output, partial
I/O failure, queue overflow, size limits, malformed input and truncated tails.
