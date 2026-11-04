# Capture service

The service records published session events without acquiring transmit authority.
A recording belongs to one acquisition epoch. Stopping and restarting a channel,
even under the same lease, does not resume an existing recording. A normal channel
stop produces a complete recording after draining its published sequence boundary.
Lease revocation, faults, service shutdown, duration limits, and source loss produce
incomplete recordings. Completion does not establish that hardware received every
bus frame before publication.

## API

All endpoints use the existing native or paired-browser authentication. Browser
mutations also require Origin and CSRF validation.

- `POST /api/v1/captures`: `session_id`, `client_request_id`, and optional
  `max_duration_seconds` (default 3600, range 1–86400).
- `GET /api/v1/captures`: list captures visible to the authenticated principal.
- `GET /api/v1/captures/{id}`: state, written counters, reason, and duration deadline.
- `POST /api/v1/captures/{id}/stop`: stop and wait for writer completion.
- `GET /api/v1/captures/{id}/download`: stream an ended capture as NDJSON.
- `DELETE /api/v1/captures/{id}`: remove an ended capture and its metadata.

Retries with the same owner and request ID return the existing recording; reuse
for a different session is rejected. Browser identities can access only their own
captures. Same-UID native clients can administer all captures, including recovered
recordings whose browser pairing no longer exists. Capture administration does not
grant channel control.

The service allows 16 stored captures, four active recordings, and two concurrent
downloads. Each writer has a bounded queue and a 64 MiB file limit. A full queue
terminates recording rather than blocking acquisition. `events` counts fully
written event records. `dropped` counts known local/source losses;
`loss_count_known=false` means it is a lower bound. Diagnostic overflow marks
unknown source loss. `expires_unix_ms` is the recording duration deadline, not a
file deletion deadline. Files remain until explicitly deleted.

## Storage and recovery

Production storage is the private `captures` directory under the native runtime
directory. The HTTP API accepts opaque UUIDs, never filesystem paths. Directories
must be owned by the current UID with no group/other permissions. Files are created
with mode 0600 and opened without following symlinks. Metadata replacement uses a
private temporary file, sync, and rename. Completed downloads carry `no-store` and
an attachment name derived from the validated UUID.

The service owns capture workers independently of HTTP request lifetime. Shutdown
waits for them and reports storage failures. Disk-full and other I/O failures are
separate reasons. Recovery scans bounded NDJSON prefixes for captures left active
in metadata, preserves known/unknown loss, and never fabricates a completion
footer. It does not resume acquisition. A torn final record remains available in
the original download; consumers must use the scanner's valid prefix boundary.

The guarantees concern application writes and explicit metadata synchronization;
they do not promise survival of arbitrary storage/controller failure. Hardware
recording and signing/notarization have not been validated.

## Clients

The Web UI provides recording start, stop, status, download, and deletion. Display
pause does not pause recording. Recording is a passive operation and does not
acquire a channel lease. Duration is explicit; neither reload nor reconnection
starts a recording automatically.

The native CLI exposes `capture start --session ID [--request-id ID] [--duration N]`,
`capture list`, `capture status ID`, `capture stop ID`,
`capture download ID --output PATH`, and `capture delete ID`. Capture IDs are
validated UUIDs. A caller retrying a start after losing its response should reuse
`--request-id`. Downloads stream through a private temporary file, enforce the
server's bounded content length, and create the destination without replacing an
existing file. An incomplete recording can be downloaded and remains explicitly
incomplete in its footer or recoverable prefix.
