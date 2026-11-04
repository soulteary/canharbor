# Submission receipts

The service reserves a bounded deduplication record before handing a frame to a
service-owned task. Cancelling the HTTP waiter does not cancel accounting or
allow the same logical request to execute again. The key is client identity,
session, lease generation and `client_request_id`. Frame comparison uses the
validated canonical frame, so hexadecimal case and an equivalent explicit DLC
do not create different payloads. Reusing a key for another frame returns 409.

POST currently waits for the backend submission result. The record is already
queryable while that wait is pending. Success returns 202 with `submitted` and
the backend's existing confirmation meaning. Virtual acceptance and native
submission remain distinct; neither is a claim about a target ECU. Failures
retain their HTTP error category. Once reserved, an error also includes a
`receipt`, `outcome_unknown`, and `X-CANHarbor-Receipt` header. A failed request
without a reserved record has no receipt. Repeating a failed logical request
returns its recorded failure rather than attempting another write.

`GET /api/v1/sessions/{session}/tx/{receipt}` reads `queued`, `submitted`,
`failed` or `outcome_unknown`. Only the creating identity can read it; no live
lease is needed to inspect an old result. The CLI provides:

```sh
canharbor receipt --session <session-id> --receipt <receipt-uuid>
```

The cache holds at most 1024 pending/completed records. Completed outcomes stay
for five minutes after completion. Pending records are not evicted to make
space or to expire a deduplication window while the operation is still running.
A full cache rejects new requests. This is process-local accounting, not a
persistent exactly-once guarantee across restart or expiry. No automatic resend
follows a lost response, disconnect, ambiguous backend failure or task panic.

New logical requests share a per-client token bucket of 100/s with burst 20
across sessions. Duplicate keys do not consume credit. Owner buckets are also
bounded and expire after five idle minutes. Rejections use 429 and distinguish
`tx_rate_limited` from cache/resource exhaustion.

A prepared transmission is single-use and bound to its originating runtime and
current acquisition permit. Its child execution permit expires after one
second and remains subject to lease expiry, stop/restart and the terminal
shutdown fence. Lease renewal cannot extend that queue deadline. Checks happen
again immediately before backend I/O. A foreign operation already issued before
revocation may finish afterwards; software deadlines do not retract it.

Backend submission panics are caught around construction and polling of the
future. The runtime revokes control, faults the acquisition and reports an
unknown outcome. Native submission faults are conservatively unknown where
attempted I/O cannot be excluded; known validation, capacity and permit
rejections are failed without implying submission. Simulated deterministic
backend faults remain known failures. Receipt tasks also account for unexpected
executor termination rather than leaving a permanent queued result.

The Web UI displays an unknown-outcome message and receipt ID when supplied by
the API. It does not infer delivery from an echo, restart a task, or retry a
failed request. Per-request firmware-echo correlation is not provided by this
receipt layer; native success remains `backend_submitted`.

Tests cover HTTP-wait cancellation, duplicate execution refusal, canonical
frames, independent owner limits, cache retention/capacity, failed and unknown
outcomes, query ownership, expired execution permits, cross-runtime rejection,
stop/restart fencing and a panic after a possible write.
