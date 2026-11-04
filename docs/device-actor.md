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
channel, then call `start(Start { ... })`. `close().await` sends a close command,
attempts device reset and joins the worker outside the async executor. In this
increment close is FIFO; priority cancellation and explicit transfer draining are
separate follow-up work. Dropping all handles ends the worker, but dropping the
Actor while retaining cloned handles is not a shutdown operation in this version.
Applications must call close explicitly.

The actor is a library boundary; it is not registered in the local service. Real
hardware sessions still require core configuration/lifecycle, diagnostic and
unknown-TX-outcome integration. No hardware compatibility or timing guarantees
are claimed. Tests use a shared fake transport and verify thread ownership,
channel isolation, echo handling, malformed input, subscriber lag and disconnect.
