# Backend lifecycle and execution permits

The core Backend contract includes asynchronous configure/start/stop/close and
submit operations. Implementations must keep blocking transport I/O off async
executor threads and enforce their own bounded queues and I/O waits. The virtual
backend implements the same contract; low-level `transmit` remains available for
synthetic bus injection, but service code uses permit-bearing `submit`.

Runtime lease expiry, explicit release, logout and service shutdown now call
backend lifecycle operations. Idle reclamation calls close before removing the
session. Stop/close failures fault the session instead of reporting a successful
state transition. Fault notifications also revoke control and attempt stop.

A lease owns a revocable Permit with a monotonic deadline. Queued backends must
check it immediately before mutating I/O, not only when accepting a command.
Renewal extends the existing permit; revocation and stop invalidate old clones.
Stop creates a fresh permit for the same still-held lease, so restarting cannot
revive queued work from the previous acquisition. A permit cannot retract I/O
that has already started, and no automatic TX retry is permitted.

Runtime submit releases the session map lock while waiting for the backend, so
revocation can invalidate a queued operation. A delayed failure cannot fault a
newer control generation. Other lifecycle transitions remain serialized under
the session map lock in this increment; they are async waits, not blocking USB
calls. Per-device lock partitioning is a future performance change requiring
separate ordering tests.

This contract precedes gs_usb runtime registration. Tests use an instrumented
virtual backend to verify physical stop hooks, close on reclamation/shutdown,
and rejection of a send queued before revocation. Hardware is not used.
