# Windows support rollout

The initial target is native Windows 11 x64 (MSVC). macOS and Linux remain supported.

## Platform foundation

`canharbor-platform` provides inclusive/active boot-time readings in nanoseconds,
process CPU seconds, current resident bytes and peak resident bytes. Windows uses
QueryInterruptTimePrecise / QueryUnbiasedInterruptTimePrecise, GetProcessTimes and
K32GetProcessMemoryInfo. Unix observations preserve their existing behavior.
Core authorization still brackets clock reads, retries preemption and rejects an
uncertain or suspended clock. No clock failure permits transmission.

Native Windows CI exercises the foundation, core authorization, virtual CAN, capture
format, API contracts, server and local client (including HTTP, events and downloads).
This is not a claim of physical adapter certification.

## Local service and private storage

Windows uses a byte-mode Named Pipe derived from the current user SID and canonical
runtime directory. It rejects remote clients, verifies the peer process user on both
ends, and creates the first instance exclusively. Its protected DACL grants access
only to the current user and SYSTEM. Native authority never falls back to TCP.
HTTP requests retain bounded headers/bodies/deadlines and are never replayed after
an uncertain response. WebSocket stream limits and receipt recovery remain unchanged.

Runtime files, preferences, captures and evidence use explicit private DACLs, owner
validation and reparse-point rejection. Atomic replacement flushes the new file and
uses MoveFileExW with WRITE_THROUGH; this does not promise power-loss durability on
every device/filesystem. Existing public paths are rejected rather than silently
adopted or having their permissions rewritten. The default runtime is under
`%LOCALAPPDATA%\CANHarbor\runtime`. A runtime lock prevents duplicate services.

## Adapter foundation

Windows builds include the SLCAN CLI feature. Select a port explicitly, e.g.
`canharbor serve --slcan COM3 --serial-baud 115200 --slcan-profile lawicel`.
`COM10` and `\\.\COM10` are normalized to device namespace paths; unrelated
paths and network names are rejected. The port is opened exclusively, configured
as 8N1 with DTR/RTS enabled and flow control disabled. Read/write use overlapped I/O;
timeouts request cancellation and reap completion before buffers/OVERLAPPED are
released. A race may complete normally; the actual byte count is preserved. Writes
are never replayed automatically. A faulty kernel driver may delay cancellation;
its buffers cannot safely be abandoned. Close restores the original port settings.
The LAWICEL and opt-in CANable FD protocol engines remain shared across platforms.
Native Windows tests exercise cancellation/reuse/disconnect on OS byte streams;
shared fake transports cover partial writes, lost ACKs, FD frames and shutdown.
Unix PTY/signal fixtures remain Unix-only; portable CLI/FFI tests run on Windows.

The gs_usb implementation uses nusb's Windows backend and requires WinUSB on the
explicitly selected gs_usb interface. Open/claim failures report the OS error and
driver prerequisite. Check Device Manager and the adapter vendor's instructions;
CANHarbor never installs/replaces drivers, detaches drivers, selects another device,
or flashes firmware automatically. CDC/SLCAN and gs_usb are distinct firmware/driver
modes; claiming support for one does not validate the other. Existing endpoint,
short-transfer, echo-deadline and cancellation-poisoning checks apply on Windows.

Windows CI runs the base workspace including CLI, SLCAN, gs_usb, Rust/C/Python
interfaces and virtual end-to-end tests. PEAK/Kvaser vendor library loaders and their
CLI options are Unix-only in this scope; their Windows vendor ABIs are not enabled
by a feature flag. The Unix jobs retain all-feature coverage.

## Remaining stage

Full embedded-web Windows CI, packaged x64 executable and extracted-package smoke tests.
Installers/signing and physical adapter certification remain separate work. Native
CI and simulated transports must not be described as physical hardware validation.
