# Rust API and local client

`canharbor-api` owns the serializable wire DTOs and schema catalog. It depends
on core types but not the HTTP service or a USB backend. The service re-exports
the contract through `canharbor_server::dto` for compatibility; converting
service-owned capture state remains in that wrapper. TypeScript and validators
continue to be generated from the same schema with no wire format changes.

`canharbor-client` provides a same-user UDS HTTP client and re-exports the
contract as `api`. Each instance gets a distinct client ID. It has typed methods
for version, discovery, session creation, acquisition, start/stop and single
frame submission, plus a generic typed request method. Requests have a ten-second
limit, JSON responses have a one-MiB streaming bound, and capture downloads keep
the existing bounded streaming and atomic no-overwrite behavior. `ApiFailure`
retains HTTP status and structured service errors for callers to inspect.

```rust,no_run
use canharbor_client::LocalClient;
# async fn example() -> Result<(), Box<dyn std::error::Error>> {
let client = LocalClient::new("/tmp/canharbor-example".into())?;
let devices = client.devices().await?;
println!("{} devices", devices.devices.len());
# Ok(())
# }
```

The caller chooses the private service runtime directory. The client uses only
its UDS and disables proxies. Session IDs are opaque strings, not UUID values;
typed session methods reject path separators and malformed IDs. Creating a
session does not acquire control or start it. The library never retries a write,
renews a lease in the background or resumes a disconnected task. Applications
own acquisition, renewal, shutdown and uncertain-result policy. The CLI retains
its foreground monitoring and signal handling outside the library.

A local integration test exercises two independent client identities, typed
responses, exclusive acquisition, active transmission, idempotency and stop.
Existing service schema, authentication and capture tests validate the shared
contract. This crate is the Rust client foundation; the exported C ABI and
Python wrapper are separate work.
