// SPDX-License-Identifier: AGPL-3.0-or-later
use std::time::{Duration, Instant};
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum Quality {
    #[default]
    HostOnly,
    HardwareUnmapped,
    Uncertain,
}
#[derive(Debug, Clone, Default)]
pub struct Stamp {
    pub raw_us: Option<u32>,
    pub extended_us: Option<u64>,
    pub epoch: u64,
    pub quality: Quality,
}
#[derive(Default)]
pub struct Clock32 {
    last: Option<(u32, u64, Instant)>,
    epoch: u64,
    uncertain: bool,
}
impl Clock32 {
    /// Extend only short, monotonic observations. A wrap is an estimate and is
    /// marked uncertain because reset/reordering cannot be excluded from bytes.
    pub fn observe(&mut self, raw: u32, host: Instant) -> Stamp {
        let mut extended = u64::from(raw);
        if let Some((previous, old, observed)) = self.last {
            let gap = host.saturating_duration_since(observed);
            let delta = u64::from(raw.wrapping_sub(previous));
            if host < observed
                || gap >= Duration::from_micros(1u64 << 31)
                || delta > gap.as_micros().min(u64::MAX as u128) as u64 + 100_000
            {
                self.epoch = self.epoch.saturating_add(1);
                self.uncertain = true;
            } else if let Some(value) = old.checked_add(delta) {
                extended = value;
                if raw < previous {
                    self.uncertain = true;
                }
            } else {
                self.epoch = self.epoch.saturating_add(1);
                self.uncertain = true;
            }
        }
        self.last = Some((raw, extended, host));
        Stamp {
            raw_us: Some(raw),
            extended_us: Some(extended),
            epoch: self.epoch,
            quality: if self.uncertain {
                Quality::Uncertain
            } else {
                Quality::HardwareUnmapped
            },
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn zero_and_monotonic_values_are_retained_without_wall_clock_mapping() {
        let now = Instant::now();
        let mut clock = Clock32::default();
        assert_eq!(clock.observe(0, now).raw_us, Some(0));
        let next = clock.observe(1000, now + Duration::from_millis(1));
        assert_eq!(next.extended_us, Some(1000));
        assert_eq!(next.quality, Quality::HardwareUnmapped);
    }
    #[test]
    fn wrap_reset_reorder_and_long_idle_never_claim_precise_mapping() {
        let now = Instant::now();
        let mut clock = Clock32::default();
        clock.observe(u32::MAX - 10, now);
        let wrap = clock.observe(10, now + Duration::from_micros(21));
        assert!(wrap.extended_us.unwrap() > u64::from(u32::MAX));
        assert_eq!(wrap.quality, Quality::Uncertain);
        let reset = clock.observe(0, now + Duration::from_millis(1));
        assert!(reset.epoch > wrap.epoch);
        assert_eq!(reset.quality, Quality::Uncertain);
        let idle = clock.observe(100, now + Duration::from_secs(5000));
        assert!(idle.epoch > reset.epoch);
        assert_eq!(idle.quality, Quality::Uncertain);
    }
}
