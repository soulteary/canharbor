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
This is not yet a claim that the packaged application or physical adapters work.

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

## Subsequent stages

1. Windows COM SLCAN transport and gs_usb/WinUSB discovery, cancellation and diagnostics.
2. Full Windows application CI, packaged x64 executable and extracted-package smoke tests.

PEAK/Kvaser Windows vendor SDK bindings, installers/signing and physical adapter
certification are separate from this initial SLCAN/gs_usb scope. Native CI and
simulated transport tests must not be described as physical hardware validation.
