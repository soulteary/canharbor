# Device diagnostic reports

`canharbor doctor --devices > report.json` exports JSON from the running local
service. Authenticated clients can use `GET /api/v1/diagnostics/devices`.
The existing `doctor` summary is unchanged. No PCBUSB dependency is introduced.

The versioned report includes the service version/instance, OS, process target
architecture, kernel release, registered channel labels, capabilities, and cached
session state/configuration/faults. Kernel release is not the macOS product
version. It does not collect hostnames, control identities, credentials, library
paths, or frame payloads. Device/channel labels may identify hardware; inspect
reports before sharing them.

Export does not acquire control, initialize a controller, send frames, perform a
liveness probe, or trigger lease maintenance. Cached state can lag expiry or a
physical disconnect. Registration does not establish current availability.
Configuration is requested configuration, not measured bus timing.

Unsupported capability queries remain visible as `capabilities_unavailable`;
unknown model, firmware, and actual loaded library version are explicit nulls.
Capabilities are backend declarations. `simulation_only`, `hardware_unverified`,
or `unknown` identify the evidence boundary. `communication_verified` is always
false: exporting a report is not a communication test. The open-source PEAK
adapter targets libPeakUSB ABI 1.0.2, not libPCBUSB 0.13.

Hardware-free coverage checks generated-schema validity, authentication, virtual
session/configuration reporting, non-maintenance of an expired running lease,
and the CLI/service route with both virtual and synthetic native PEAK channels.
These results do not certify a physical adapter or firmware version.

## Request log

`canharbor serve --log-requests` writes one line to standard error for each
request that changes state or fails:

```text
canharbor: request POST /api/v1/sessions/{id}/start -> 409 in 2 ms (local client)
```

Lines name the route template, the HTTP status, the handling time and whether the
request came over the local socket or from a browser. Session, capture and
receipt identifiers, query strings, request and response bodies, frame payloads
and credentials are not written. Successful reads are omitted because clients
poll them. The log is off by default, is not persisted by the service, and does
not cover backend or device I/O.
