# gs_usb device actor

`actor::Actor` runs one named worker thread for a physical device. Initialization,
configuration, TX and shared USB-IN polling stay on that thread. Tokio callers
use a cloneable `Handle`; none of its methods execute blocking USB I/O on the
async executor. One worker services every channel, with at most one command
before each receive poll, so continuous commands do not starve input.

The command queue holds 32 operations. Saturation returns `QueueFull` before the
operation is enqueued. Each command has a one-shot response. A command whose
response was dropped before execution is skipped. Cancellation after execution
begins does not retract I/O, and losing a TX response does not establish that the
frame was unsent. There is no automatic retry.

Each channel has a 256-entry broadcast ring. Observers subscribe before starting
acquisition. Slow observers get Tokio's explicit `Lagged` result and cannot block
the device worker or other observers. Malformed records emit `Rejected` notices;
transport failures notify all channels, reset the device on a best-effort basis,
and close streams and command receivers. A stopped channel's late completion is
discarded. Protocol errors do not silently become ordinary CAN frames.

Use `Actor::spawn(transport, interface).await`, obtain a handle, subscribe to a
channel, then call `start(Start { ... })`. `close().await` sets a priority signal
without using a command slot. Before executing further commands the worker
rejects queued work, attempts channel reset, cancels/drains both USB directions,
drops device resources and exits. Join runs outside the async executor. Cloned
handles reject requests once closing begins.

`close` returns a `CloseReport`: inspect reset, drain, terminal fault and unknown
TX IDs/channels separately. Completion of the worker does not imply that reset
succeeded or that a submitted frame was cancelled. The one-second cleanup budget
is shared by resets and draining; later resets are skipped when it expires. A
reset already in progress has the transport's own timeout and may finish after
this budget. OS scheduling and kernel behavior cannot be hard-bounded here.

Dropping the Actor requests the same cleanup even if handles survive. Drop does
not wait or return failures; call close explicitly to join and inspect results.
Dropping a close future loses the report, but cleanup continues. Initialization
cancellation is observed after bounded control operations complete; initialization
is not forcibly interrupted. Cancellation of an in-progress TX never means the
frame was unsent. No automatic reopening or retry occurs.

The actor is a library boundary; it is not registered in the local service. Real
hardware sessions still require core configuration/lifecycle, diagnostic and
unknown-TX-outcome integration. No hardware compatibility or timing guarantees
are claimed. Tests use a shared fake transport and verify thread ownership,
channel isolation, echo handling, malformed input, subscriber lag and disconnect.

## Missing firmware echoes

The gs_usb engine allows two seconds from submission for a matching firmware
 echo. This is a software deadline, not a CAN delivery timeout. The actor checks
it even when the receive endpoint is idle and before accepting another command.
Expiry faults the whole physical-device actor, rejects queued operations and
closes the transport. The backend reports a transmit fault. No automatic retry,
reset/restart or claim of failed bus delivery follows.

Pending IDs remain reserved until the consumed device's close report accounts
for them as unknown. They are not recycled after timeout, and a late record
cannot revive the actor or release a slot in a new acquisition. One missing
echo can therefore stop other channels sharing the device; this conservative
policy prevents continuing an acquisition with ambiguous shared TX state. A new
explicit device instance is required. The fixed two-second policy has only
synthetic evidence and may need a documented configurable bound after hardware
measurements.
