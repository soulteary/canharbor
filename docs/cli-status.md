# CLI completion and exit status

The CLI writes data and successful JSON responses to stdout. Errors and
shutdown diagnostics go to stderr. Returned errors use these exit codes:

- 0: successful completion, including a normal interrupted monitor.
- 2: invalid arguments, frame/configuration input, or rejected credentials.
- 3: the local service cannot be contacted or its response transport ends early.
- 4: a requested resource/device is missing or the device is disconnected.
- 5: occupied resources, stale/expired leases, or conflicting revisions/state.
- 6: backend/bus I/O faults or an invalid service response.
- 7: a submission or shutdown includes an unknown transmission outcome.
- 8: queue, cache, storage or client response-size limits.

Help/version and argument parsing keep clap's normal completion behavior. Native
SDK errors and HTTP categories retain their structured distinction. A known
backend failure is not automatically reclassified as an uncertain transmission;
complete, explicit outcome metadata determines that distinction. Unstructured
server errors and older envelopes without outcome metadata remain unknown.

After an active session starts, the send command makes one POST for the frame.
A lost/malformed response or SIGINT while awaiting that result returns 7. It
prints the session and request ID and does not resubmit. A structured unknown
response also prints its receipt ID. Sender cleanup gets a separate two-second
requested budget and cannot replace the primary submission error with a cleanup
error. The service may already have accepted the frame; interruption does not
establish cancellation or failed bus delivery.

The service's shutdown report returns 7 if it contains unconfirmed transmissions,
including when cleanup also reports failures. Cleanup failures are still printed.
A shutdown failure without unknown transmissions returns 6. These statuses do
not make the underlying native API's physical-delivery evidence stronger.

The Rust client exposes typed transport, invalid-argument and resource-limit
errors to keep callers from parsing strings. C ABI status mapping uses a modern
receipt's explicit outcome metadata: a known recorded failure remains I/O code
6, and an ambiguous result remains 7. Older/missing mutation metadata is treated
conservatively. JSON response limits remain enforced before copying buffers.

Subprocess tests use synthetic UDS peers to verify 2 through 8, stdout/stderr
separation, one TX attempt after a lost reply, receipt/session diagnostics and
SIGINT with bounded cleanup. The C integration test also checks a deterministic
virtual failure. No real CAN bus is used.
