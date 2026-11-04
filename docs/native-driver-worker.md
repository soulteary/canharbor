# Native driver worker boundary

`canharbor-driver` owns optional driver adapters on one dedicated thread. Driver
construction, discovery, start, receive, submit, stop, and drop run on that thread.
The Rust `Driver` trait is an internal adapter boundary, not a stable exported C
ABI. Foreign API translation and licensing remain the responsibility of each
vendor adapter.

A backend has at most 32 selected channels, 32 queued requests, and a 256-event
broadcast ring per channel. Receive is nonblocking and polled in batches of at
most 16 events per channel. A slow observer cannot block another channel.
Configuration is stored while stopped; it does not start hardware. Mutating driver
calls receive an execution-time guard and must check it before each underlying
I/O operation. Cancelled queued starts and submissions are skipped. A cancelled
or partially failed start is stopped before more work is accepted.

Shutdown uses a separate atomic signal, fences further startup/transmission, and
joins the owner thread. It does not require room in the command queue. Every
selected channel receives cleanup, including partially initialized channels.
Cleanup is idempotent, retires unknown counts once, and releases only handles
owned by that driver. Stop reports and cleanup failures are retained in the final
summary. Repeated shutdown returns the same summary.

Faults and receive overflow stop the affected channel and revoke its runtime
control. Other channels remain independent unless the driver reports a fault for
them as well. Reopening requires a new backend epoch; the worker does not retry
transmissions, recover bus-off automatically, or restore leases.

Adapters must honor the nonblocking receive contract and provide bounded
underlying calls. The worker cannot forcibly cancel an arbitrary foreign function
that fails to return. Vendor adapters must document their tested library version,
call limits, and unresolved hardware evidence. No native library is loaded by this
crate itself, and the HTTP API cannot select a library path.

Tests use a thread-checking fake driver to exercise multi-channel routing, unknown
outcome aggregation, cancellation between startup calls, partial-resource cleanup,
priority shutdown with a full queue, overflow isolation, and owner drop.
