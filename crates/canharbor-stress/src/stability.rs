// SPDX-License-Identifier: AGPL-3.0-or-later
use super::*;
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, schemars::JsonSchema)]
#[serde(deny_unknown_fields)]
#[schemars(rename = "StressStabilityLimits")]
pub struct StabilityLimits {
    pub max_rss_growth_bytes: Option<u64>,
    pub warmup_seconds: u32,
}
impl Default for StabilityLimits {
    fn default() -> Self {
        Self {
            max_rss_growth_bytes: None,
            warmup_seconds: 60,
        }
    }
}
impl StabilityLimits {
    pub fn is_default(&self) -> bool {
        self == &Self::default()
    }
}
#[derive(Clone, Debug, Default, Serialize, Deserialize, schemars::JsonSchema)]
#[schemars(rename = "StressStabilityReport")]
pub struct StabilityReport {
    pub baseline_rss_bytes: Option<u64>,
    pub latest_rss_bytes: Option<u64>,
    pub max_growth_bytes: u64,
    pub samples: u64,
    pub limit_exceeded: bool,
    pub status: String,
}
impl StabilityReport {
    pub fn observe(&mut self, limits: &StabilityLimits, elapsed: Duration, rss: Option<u64>) {
        self.samples += 1;
        self.latest_rss_bytes = rss;
        let Some(limit) = limits.max_rss_growth_bytes else {
            self.status = "disabled".into();
            return;
        };
        if elapsed < Duration::from_secs(u64::from(limits.warmup_seconds)) {
            self.status = "warming".into();
            return;
        }
        let Some(rss) = rss else {
            self.status = "unsupported".into();
            return;
        };
        let baseline = *self.baseline_rss_bytes.get_or_insert(rss);
        self.max_growth_bytes = self.max_growth_bytes.max(rss.saturating_sub(baseline));
        self.limit_exceeded = self.max_growth_bytes > limit;
        self.status = if self.limit_exceeded {
            "exceeded"
        } else {
            "monitoring"
        }
        .into();
    }
}
#[cfg(target_os = "macos")]
#[allow(deprecated)] // Pinned libc owns the complete Mach ABI used for this read-only probe.
pub fn current_rss() -> Option<u64> {
    let mut value = std::mem::MaybeUninit::<libc::mach_task_basic_info>::uninit();
    let mut count = libc::MACH_TASK_BASIC_INFO_COUNT;
    // SAFETY: own task port, correctly sized output and count; read only on success.
    if unsafe {
        libc::task_info(
            libc::mach_task_self(),
            libc::MACH_TASK_BASIC_INFO,
            value.as_mut_ptr().cast(),
            &mut count,
        )
    } != libc::KERN_SUCCESS
    {
        return None;
    }
    // SAFETY: task_info initialized the complete basic-info structure.
    Some(unsafe { value.assume_init() }.resident_size)
}
#[cfg(target_os = "linux")]
pub fn current_rss() -> Option<u64> {
    let page = unsafe { libc::sysconf(libc::_SC_PAGESIZE) };
    if page <= 0 {
        return None;
    }
    std::fs::read_to_string("/proc/self/statm")
        .ok()?
        .split_whitespace()
        .nth(1)?
        .parse::<u64>()
        .ok()?
        .checked_mul(page as u64)
}
#[cfg(not(any(target_os = "linux", target_os = "macos")))]
pub fn current_rss() -> Option<u64> {
    None
}
