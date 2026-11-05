// SPDX-License-Identifier: AGPL-3.0-or-later
//! Compare clocks with/without suspended time; wall-clock adjustments are irrelevant.
#[derive(Clone, Copy)]
pub(crate) struct Sample {
    lower: u128,
    upper: u128,
}
const TOLERANCE_NS: u128 = 1_000_000;
impl Sample {
    fn bracket(before: u128, active: u128, after: u128) -> Option<Self> {
        if after < before || after - before > TOLERANCE_NS || after < active {
            return None;
        }
        Some(Self {
            lower: before.saturating_sub(active),
            upper: after - active,
        })
    }
}
pub(crate) fn valid(initial: Option<Sample>, current: Option<Sample>) -> bool {
    match (initial, current) {
        (Some(a), Some(b)) => {
            b.lower <= a.upper.saturating_add(TOLERANCE_NS)
                && a.lower <= b.upper.saturating_add(TOLERANCE_NS)
        }
        _ => false,
    }
}
#[cfg(target_os = "macos")]
pub(crate) fn sample() -> Option<Sample> {
    use std::sync::OnceLock;
    #[repr(C)]
    struct Timebase {
        numer: u32,
        denom: u32,
    }
    unsafe extern "C" {
        fn mach_continuous_time() -> u64;
        fn mach_absolute_time() -> u64;
        fn mach_timebase_info(info: *mut Timebase) -> i32;
    }
    static SCALE: OnceLock<Option<(u32, u32)>> = OnceLock::new();
    let &(numer, denom) = SCALE
        .get_or_init(|| {
            let mut info = Timebase { numer: 0, denom: 0 };
            // SAFETY: system call writes one initialized timebase structure.
            if unsafe { mach_timebase_info(&mut info) } != 0 || info.numer == 0 || info.denom == 0 {
                None
            } else {
                Some((info.numer, info.denom))
            }
        })
        .as_ref()?;
    // SAFETY: pure system clock reads, available on macOS 10.12 and later.
    let (before, active, after) = unsafe {
        (
            mach_continuous_time(),
            mach_absolute_time(),
            mach_continuous_time(),
        )
    };
    let ns = |ticks: u64| u128::from(ticks) * u128::from(numer) / u128::from(denom);
    Sample::bracket(ns(before), ns(active), ns(after))
}
#[cfg(target_os = "linux")]
pub(crate) fn sample() -> Option<Sample> {
    fn clock(id: libc::clockid_t) -> Option<u128> {
        let mut time = libc::timespec {
            tv_sec: 0,
            tv_nsec: 0,
        };
        // SAFETY: system call writes one initialized timespec.
        if unsafe { libc::clock_gettime(id, &mut time) } != 0
            || time.tv_sec < 0
            || !(0..1_000_000_000).contains(&time.tv_nsec)
        {
            return None;
        }
        Some(time.tv_sec as u128 * 1_000_000_000 + time.tv_nsec as u128)
    }
    Sample::bracket(
        clock(libc::CLOCK_BOOTTIME)?,
        clock(libc::CLOCK_MONOTONIC)?,
        clock(libc::CLOCK_BOOTTIME)?,
    )
}
#[cfg(not(any(target_os = "linux", target_os = "macos")))]
pub(crate) fn sample() -> Option<Sample> {
    None
}
#[cfg(test)]
pub(crate) fn shifted_sample() -> Option<Sample> {
    sample().map(|s| Sample {
        lower: s.lower + 10_000_000,
        upper: s.upper + 10_000_000,
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn active_progress_is_valid_but_suspend_and_uncertain_clocks_are_not() {
        let before = Sample::bracket(1_000_000, 500_000, 1_000_100);
        assert!(valid(
            before,
            Sample::bracket(11_000_000, 10_500_000, 11_000_100)
        ));
        assert!(!valid(
            before,
            Sample::bracket(21_000_000, 10_500_000, 21_000_100)
        ));
        assert!(!valid(before, None));
        assert!(Sample::bracket(0, 0, TOLERANCE_NS + 1).is_none());
        assert!(Sample::bracket(10, 0, 9).is_none());
    }
    #[test]
    fn native_samples_are_consistent_without_suspending_the_machine() {
        assert!(valid(sample(), sample()));
    }
}
