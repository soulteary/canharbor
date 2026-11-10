# Windows support rollout

The initial target is native Windows 11 x64 (MSVC). macOS and Linux remain supported.

## Platform foundation

`canharbor-platform` provides inclusive/active boot-time readings in nanoseconds,
process CPU seconds, current resident bytes and peak resident bytes. Windows uses
QueryInterruptTimePrecise / QueryUnbiasedInterruptTimePrecise, GetProcessTimes and
K32GetProcessMemoryInfo. Unix observations preserve their existing behavior.
Core authorization still brackets clock reads, retries preemption and rejects an
uncertain or suspended clock. No clock failure permits transmission.

Native Windows CI currently exercises the foundation, core authorization, virtual
CAN, capture format and API contract crates. This is not yet a claim that the full
application or a physical adapter works on Windows.

## Subsequent stages

1. Private Windows storage, same-user Named Pipe HTTP/events, local client and shutdown.
2. Windows COM SLCAN transport and gs_usb/WinUSB discovery, cancellation and diagnostics.
3. Full Windows application CI, packaged x64 executable and extracted-package smoke tests.

PEAK/Kvaser Windows vendor SDK bindings, installers/signing and physical adapter
certification are separate from this initial SLCAN/gs_usb scope. Native CI and
simulated transport tests must not be described as physical hardware validation.
