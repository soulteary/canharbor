# Suspend-aware transmission permits

A control permit records a bracketed comparison between clocks that include and
exclude time suspended. macOS uses `mach_continuous_time` and
`mach_absolute_time`; Linux uses `CLOCK_BOOTTIME` and `CLOCK_MONOTONIC`.
Wall-clock adjustments do not affect this comparison.

Every root permit check samples the clocks again. A changed offset outside a
one-millisecond tolerance, a failed clock read, or sampling uncertainty above
one millisecond revokes the permit. Child execution permits check their parent.
Renewal cannot revive a revoked permit. Native backend mutation guards therefore
reject stale work without waiting for the service maintenance timer to run.
Maintenance and authorization also treat an invalid permit as expired, clear
control, stop the channel and finish its acquisition. A new explicit acquisition
creates a new clock baseline; transmission is never resumed automatically.

The bracket accounts for time spent sampling rather than mistaking ordinary
process scheduling delay for system sleep. A heavily delayed sample fails
closed. The tolerance is explicit: this is not a claim to detect arbitrarily
short hardware sleep transitions. Existing queue and lease deadlines still
apply. An operation already issued before revocation cannot be retracted.

The macOS clock contract was checked against the installed SDK's
`usr/include/mach/mach_time.h` (continuous time is available from macOS 10.12).
Linux semantics are documented in the
[kernel timekeeping documentation](https://docs.kernel.org/core-api/timekeeping.html).
No external implementation was copied. Tests exercise synthetic suspend offsets,
invalid samples, child revocation, renewal refusal and native clock consistency.
Physical sleep/wake acceptance remains deferred.
