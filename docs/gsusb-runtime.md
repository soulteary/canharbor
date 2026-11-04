# gs_usb runtime adapter

`GsUsbBackend::open` wraps an explicit transport in one device actor and implements
the core asynchronous backend contract. The caller assigns an identifier for
this device-open epoch; it must change on reopen. Each channel has independent
configuration and event delivery. Shared actor ownership prevents multiple
channels from competing for the USB-IN endpoint.

Configuration solves an exact nominal/data bitrate using advertised timing
limits and checks listen-only/FD features. Creating a core session reserves a
stopped configuration. Starting and submitting TX carry a revocable lease permit
into the actor. Startup checks the permit before each configuration/start control
request; TX checks it before bulk submission. Raw driver APIs remain available
for driver tests and do not constitute the service authorization boundary.

Actor events retain worker observation time before crossing asynchronous queues.
Firmware echoes are routed as TX observations; RX is separate. Unmatched echoes
are diagnostic rejections. Error-frame bytes are retained in a bounded 64-entry
diagnostic ring and never emitted as ordinary data. Bus-off and receive overflow
fault the runtime session; device faults require explicit reopen with a new epoch.
Hardware timestamp mapping and diagnostic streaming are separate increments.

Channel close resets that channel. Backend shutdown consumes the actor, joins
cleanup and checks reset/drain results. Dropping the backend requests actor
cleanup as a fallback. The current runtime shutdown entry point does not yet
return its aggregate cleanup errors to callers; service diagnostics integration
must make those results visible before a supported hardware release.

Tests use a fake transport and exercise core sessions through the driver actor,
including execution-time revocation, RX/TX routing and raw bus-off preservation.
This is not real-device validation. The local service/CLI still need composition
and explicit device-selection wiring in the next increment.
