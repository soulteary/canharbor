# M0 implementation status

This increment implements the virtual backend, local service, CLI, and Web UI path. It does not complete the hardware prototype or the full v0.1 API described in the design.

## Implemented

- Five Rust crates with a pinned toolchain and Cargo lockfile. `canharbor-gsusb` is explicitly unimplemented and is not registered as a device.
- Classic data, Classic RTR, and CAN FD validation at the backend boundary.
- Two virtual channels on a shared bus, without generated traffic. A sender receives local TX echo; the other running channel receives RX.
- Exclusive channel sessions, listen-only mode, expiring control leases, generation fencing, and deterministic lease tests using a paused Tokio clock.
- Same-user Unix socket transport with owner/mode checks and a service lock. Native clients assert their client UUID only over that UID-checked transport; this is not a security boundary between processes owned by the same user.
- Loopback HTTP with exact Host/Origin checks, one-time browser pairing, HttpOnly/SameSite cookies, CSRF validation, and authenticated WebSocket subscriptions.
- Bounded event delivery, WebSocket batching, subscriber gap messages, and bounded browser history.
- CLI device enumeration, diagnostics, session creation/listing, foreground monitoring, one-shot transmission, and browser pairing.
- React workbench for device/session selection, control, start/stop, Classic/RTR/FD single-frame transmission, and a frame table.
- Rust-derived JSON Schema and generated TypeScript, CI drift checks, and runtime validation of HTTP/WebSocket payloads.
- Deterministic disconnect, bus-off, receive-overflow and one-shot TX-failure injection through the virtual-backend harness API, without HTTP exposure.
- Optional embedding of the production frontend in the executable. Core builds do not require Node.js or a frontend build.

## Current limits

The virtual bus models connectivity, not arbitration, bit timing, ACK behavior, electrical faults, or physical timestamps. Bitrates are accepted only for the fixed simulated configuration. TX receipts report virtual-bus acceptance, not delivery to a physical device.

M0 frame values are revalidated at the backend boundary, including frames constructed with public enum variants. The network DTO is separate from the core model. JSON Schema and TypeScript are generated from Rust wire DTOs. The browser validates received payloads using that schema; shared fixtures cover frame constraints and exact u64 string boundaries. The catalog is not an OpenAPI routing specification; endpoint/client generation remains separate work. See [API contract generation](api-schema.md).

Session event buffers hold 256 events. A lagging WebSocket receives a gap count; lag at the backend-to-session boundary stops the session, records receive_overflow, revokes control and closes the old stream. Fault state remains available for diagnosis until idle reclamation. Recovery requires a fresh lease and explicit start; backend health restoration alone does not resume traffic. There is no retained stream history or automatic reconnection. The table keeps at most 500 frames, and display pause discards display updates while reception counters continue.

Idempotent TX responses are retained for five minutes, up to 1024 entries globally. Request IDs must be unique per client/session/generation. There is no persistent receipt query endpoint or exactly-once guarantee across restarts. The service has session/connection/message-size limits; per-client TX token-bucket limiting from the full design is not yet implemented. The service is loopback-only and has no supported remote mode.

Browser refresh clears this page's control state. Lease expiry stops the session and unowned sessions are reclaimed after 60 seconds. A disconnected page is not immediately detected; the lease TTL is the stop boundary. This prototype does not manage long-lived delegated tasks.

CLI runtime errors currently use exit code 1; clap argument errors use 2. The detailed exit-code map, capture commands, runtime reconfiguration/ETags, capability endpoint, and scheduled tasks remain pending. No development-origin bypass or Vite API proxy is implemented: test the integrated frontend through the Rust service.

Release source archives, SBOM/third-party notice generation, signing/notarization, and exact-build source links are not implemented. `/api/v1/legal` explicitly identifies the development build. No release binaries are included in the repository.

## Remaining M0 work

- Extend the deterministic fault model toward physical-device scenarios and add protocol fuzzing.
- Build the nusb probe and collect Classic CAN / CAN FD hardware evidence.
- Verify the minimum supported macOS version and Safari behavior on actual target systems.

These items do not block demonstrating the virtual CLI/Web UI path, but must remain visible before describing M0 as complete.
