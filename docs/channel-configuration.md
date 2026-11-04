# Capability queries and revision-guarded configuration

GET /api/v1/channels/{id}/capabilities returns advertised FD, listen-only and
hardware-timestamp flags, nominal/data timing bounds where reported, and fixed
bitrate lists for the virtual backend. An empty fixed list means rates are
constrained by timing bounds rather than an enumerated list. No hardware
verification is implied. CLI: canharbor capabilities --channel <id>.

Session responses include the effective mode and exact nominal/data bitrates.
Missing FD configuration means Classic CAN, including on the virtual backend.
CAN FD transmission requires explicit FD configuration. The programmatic M0
Runtime::create convenience helper retains its FD-capable virtual default;
service callers use create_configured with explicit configuration.

GET /api/v1/sessions/{id} returns a quoted decimal ETag. To change settings, send
PATCH /api/v1/sessions/{id}/config with the Config payload, a valid control lease
generation, and If-Match containing that ETag. Missing revision returns 428,
malformed revision 400, stale revision 412, and a running session 409. Mutation
is serialized with the revision check. Success returns the updated Session and
ETag; configuration failure does not apply the new settings. Backend faults revoke
control and close the old stream. Configuration never starts acquisition.

The Web UI can apply the visible settings to the selected stopped session after
explicit control acquisition. Generated Rust/JSON Schema/TypeScript contracts
cover the new payloads. API tests validate successful responses and rejection
paths; Playwright exercises configuration before starting a virtual session.
