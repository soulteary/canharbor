# C ABI version 1

`canharbor-ffi` builds `libcanharbor_ffi.dylib` on macOS and
`libcanharbor_ffi.so` on Linux. The public header is `include/canharbor.h`.
This is CANHarbor's local-service ABI, not a replacement for PCAN-Basic or
Kvaser CANlib. No hardware library is linked by this crate.

```sh
cargo build -p canharbor-ffi
cc -std=c11 -Iinclude crates/canharbor-ffi/examples/local-client.c \
  -Ltarget/debug -lcanharbor_ffi -Wl,-rpath,"$PWD/target/debug" -o /tmp/ch-example
/tmp/ch-example /absolute/private/service-runtime-directory
```

The ABI uses fixed-width integer handles and explicit UTF-8 byte lengths. It
exchanges the versioned API's JSON payloads; the Rust/TypeScript contract and
JSON Schema also describe these payloads. `canharbor_abi_version()` returns 1.
Future incompatible changes require a new ABI major, not a changed C layout.
There are no Rust enum, allocator, string, exception or trait-object values
across this boundary. All caller pointers must satisfy the header's memory
contract. Panic containment cannot make invalid C memory safe.

Open creates a distinct client identity and an owned worker with its own Tokio
runtime. Calls from an existing application event loop do not nest a runtime.
At most 32 clients, four queued calls per client and 64 response reservations
can be live. Each call has a ten-second execution deadline including queue wait;
its blocking caller waits at most eleven seconds for completion. These are
requested software limits, not real-time scheduling guarantees.

`canharbor_request` performs one HTTP attempt and returns a response handle.
A zero function result means that a response object is available. Inspect
`canharbor_response_status` separately for API/transport success, then obtain
its byte count with `canharbor_response_copy(handle, NULL, 0, &needed)`. This
size query returns `CANHARBOR_LIMIT` for a nonempty response. Allocate a caller
buffer of that size and copy; copies do no I/O and never repeat a request.
Release every response. Response handles remain valid after client close.
Handles are not reused, so a stale handle cannot address a later object.

Status codes follow the CLI categories: 0 success, 2 invalid request, 3 service
unavailable, 4 missing object, 5 conflict, 6 I/O failure, 7 outcome unknown,
8 resource/buffer limit; 9 is an internal ABI error. Structured API errors
retain their HTTP status and detail in the response JSON. A failed or timed-out
mutation can have an unknown outcome. Do not automatically resend it. Preserve
its `client_request_id` and inspect a service receipt where available. A
submission response is not evidence of physical bus delivery.

Client close fences queued work and releases its transport when the in-flight
call finishes. It cannot retract an already issued HTTP request, terminate a
foreign application's thread, or revoke bytes already accepted by the service.
It does not implicitly close user sessions: callers should explicitly stop and
release their own lease; otherwise the service TTL policy remains in effect.
The library never acquires, renews or transfers control implicitly.

The C example discovers the service version and devices. Tests compile and link
it against the actual shared library, then run it against a virtual service.
Other tests cover control, idempotency, invalid input, response ownership and
limits, full-queue refusal and close fencing without another HTTP transaction.
No hardware, platform signing or notarization is exercised. This initial ABI
covers HTTP JSON control. Streaming events and binary capture downloads require
separate receive/download interfaces and are not claimed here.

The additive ABI 1 `canharbor_request_with_query` extension accepts query
parameters as a JSON array of string pairs. It preserves the original request
function and all response ownership rules. Queries are limited to 16 pairs and
4096 decoded UTF-8 bytes, with a 16 KiB encoded JSON input bound. Parameters are
encoded separately; raw paths containing query or fragment syntax remain invalid.
This permits read-only receipt recovery without changing a client identity or
repeating a transmission.
