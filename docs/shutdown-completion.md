# Shutdown completion and cancellation

Runtime shutdown starts one owned cleanup task. Cancelling a caller waiting for
that task does not cancel channel cleanup or discard the backend report. Later
callers wait for the same completion and receive its failures and unknown
transmission count. A failed cleanup task reports unavailable outcomes rather
than returning a successful default summary.

Starting shutdown also sets a shared terminal fence on every runtime-issued
control permit, before waiting for the session mutex. A backend checking a queued
or in-progress startup permit therefore rejects subsequent mutating I/O even
while shutdown is waiting for the startup operation to release that mutex. An I/O
operation already issued cannot be retracted. Permit renewal and session restart
do not clear the runtime's terminal fence.

The gs_usb and SLCAN adapters retain their join results independently of each
waiter. Repeated shutdown observes the original result, including reset/drain
failures and unknown transmissions. The native driver worker follows the same
completion rule. Drop remains a cleanup request and does not return a report.

Capture workers retain a separate completion signal. Shutdown still observes a
storage failure after a cancelled waiter has taken the task handle. Unexpected
worker termination is retained separately from storage failure; status reads mark
the capture failed and stop reports `capture_worker_failed`. Prefix recovery does
not invent a complete recording after such termination.

Tests gate backend cleanup, startup, transport drop, and capture finalization to
cancel the first waiter at a known pending point. They verify that a second waiter
remains pending until cleanup ends and receives the actual result. Additional
tests cover shutdown during startup, interrupted capture workers, and persistent
capture metadata errors. These tests use virtual devices and scripted transports.
