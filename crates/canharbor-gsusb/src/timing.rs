// SPDX-License-Identifier: AGPL-3.0-or-later
//! Exact-rate timing search with a bounded divisor enumeration.
use crate::{
    Error,
    control::{Limits, Timing},
};
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Solution {
    pub timing: Timing,
    pub bitrate: u32,
    pub sample_point_per_mille: u16,
}
/// Require an exact bitrate; never silently select a nearby rate. The sample
/// point is a preference and the actual value is returned. At most 65535 divisor
/// pairs are considered even with untrusted u32 device limits.
pub fn solve(
    clock_hz: u32,
    bitrate: u32,
    sample_point_per_mille: u16,
    limits: Limits,
) -> Result<Solution, Error> {
    if clock_hz == 0
        || bitrate == 0
        || sample_point_per_mille == 0
        || sample_point_per_mille >= 1000
        || !clock_hz.is_multiple_of(bitrate)
        || limits.brp_inc == 0
    {
        return Err(Error::Protocol("unsatisfiable timing request"));
    }
    let ticks = u64::from(clock_hz / bitrate);
    let mut best: Option<(u64, u64, Timing)> = None;
    let mut consider = |brp: u64| {
        if brp < u64::from(limits.brp_min)
            || brp > u64::from(limits.brp_max)
            || !(brp - u64::from(limits.brp_min)).is_multiple_of(u64::from(limits.brp_inc))
        {
            return;
        }
        let total = ticks / brp;
        let low =
            u64::from(limits.tseg2_min).max(total.saturating_sub(1 + u64::from(limits.tseg1_max)));
        let high =
            u64::from(limits.tseg2_max).min(total.saturating_sub(1 + u64::from(limits.tseg1_min)));
        if low > high || total < 3 {
            return;
        }
        let ideal = (total * u64::from(1000 - sample_point_per_mille) + 500) / 1000;
        for phase2 in [
            ideal.clamp(low, high),
            ideal.saturating_sub(1).clamp(low, high),
        ] {
            let Some(phase1) = total.checked_sub(1 + phase2) else {
                continue;
            };
            let Ok(phase_seg1) = u32::try_from(phase1) else {
                continue;
            };
            let timing = Timing {
                prop_seg: 0,
                phase_seg1,
                phase_seg2: phase2 as u32,
                sjw: 1,
                brp: brp as u32,
            };
            if timing.validate(limits).is_err() {
                continue;
            }
            let error = (1000 * (1 + phase1)).abs_diff(u64::from(sample_point_per_mille) * total);
            if best.as_ref().is_none_or(|(old_error, old_total, _)| {
                u128::from(error) * u128::from(*old_total)
                    < u128::from(*old_error) * u128::from(total)
                    || (u128::from(error) * u128::from(*old_total)
                        == u128::from(*old_error) * u128::from(total)
                        && total > *old_total)
            }) {
                best = Some((error, total, timing));
            }
        }
    };
    let mut divisor = 1;
    while divisor * divisor <= ticks {
        if ticks.is_multiple_of(divisor) {
            consider(divisor);
            consider(ticks / divisor);
        }
        divisor += 1;
    }
    let (_, total, timing) = best.ok_or(Error::Unsupported("exact CAN bitrate"))?;
    Ok(Solution {
        timing,
        bitrate,
        sample_point_per_mille: ((1000 * (total - u64::from(timing.phase_seg2)) + total / 2)
            / total) as u16,
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    fn limits() -> Limits {
        Limits {
            tseg1_min: 1,
            tseg1_max: 256,
            tseg2_min: 1,
            tseg2_max: 128,
            sjw_max: 128,
            brp_min: 1,
            brp_max: 1024,
            brp_inc: 1,
        }
    }
    #[test]
    fn exact_nominal_and_fd_data_rates() {
        for clock in [24_000_000, 48_000_000, 80_000_000] {
            for rate in [
                10_000, 125_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
            ] {
                if clock % rate != 0 {
                    assert!(solve(clock, rate, 875, limits()).is_err());
                    continue;
                }
                let s = solve(clock, rate, 875, limits()).unwrap();
                s.timing.validate(limits()).unwrap();
                let total = 1 + s.timing.prop_seg + s.timing.phase_seg1 + s.timing.phase_seg2;
                assert_eq!(
                    u64::from(total) * u64::from(s.timing.brp) * u64::from(rate),
                    u64::from(clock)
                );
                assert!(s.sample_point_per_mille > 0 && s.sample_point_per_mille < 1000);
            }
        }
    }
    #[test]
    fn invalid_rates_and_prescaler_constraints_are_not_approximated() {
        for (clock, rate, point) in [
            (0, 500000, 875),
            (48000000, 0, 875),
            (48000000, 333333, 875),
            (48000000, 500000, 1000),
        ] {
            assert!(solve(clock, rate, point, limits()).is_err());
        }
        let mut l = limits();
        l.brp_min = 3;
        l.brp_max = 9;
        l.brp_inc = 3;
        let s = solve(48_000_000, 500_000, 800, l).unwrap();
        assert!([3, 6].contains(&s.timing.brp));
        l.brp_inc = 0;
        assert!(solve(48_000_000, 500_000, 875, l).is_err());
    }
    #[test]
    fn extreme_device_limits_are_bounded_and_overflow_safe() {
        let mut l = limits();
        l.tseg1_max = u32::MAX;
        l.tseg2_max = u32::MAX;
        l.brp_max = u32::MAX;
        let s = solve(u32::MAX, 1, 999, l).unwrap();
        s.timing.validate(l).unwrap();
        l.tseg1_min = u32::MAX;
        assert!(solve(48_000_000, 500_000, 875, l).is_err());
    }
}
