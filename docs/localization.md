# Localization

The workbench embeds English and Simplified Chinese resources. The language
selector offers Auto, English and 简体中文. Auto follows the browser's first
supported language; unsupported languages fall back to English. Resource loading
requires no external network request.

The current origin's explicit choice is cached in localStorage. A paired browser
also saves the default through `PUT /api/v1/preferences`, using the existing
Origin, cookie and CSRF checks. The preference is injected into the next HTML
bootstrap so it survives a service restart with a different HTTP port. Existing
pages are not changed by another page saving a default.

The service stores `preferences.json` under `CANHARBOR_CONFIG_DIR`, or under
`~/Library/Application Support/CANHarbor` on macOS and
`$XDG_CONFIG_HOME/canharbor` (otherwise `~/.config/canharbor`) on Linux. Writes
require a private, user-owned directory and atomically replace the settings file.
A failed save leaves the current page's language usable and reports the failure.
Preferences do not contain pairing tokens, device configuration or control state.

Language updates must not remount the workbench, acquire or renew a lease,
resubmit a frame, restart a task, change a stress-plan hash or reinterpret an
unknown submission. Wire identifiers, JSON keys, HEX data and raw evidence stay
language independent. CSS selectors must not depend on translated labels.

Implementation proceeds in separate changes: foundation and preferences, core
connection/monitor/transmission views, recording/offline/task/stress views,
structured error presentation, CLI and launch instructions, then acceptance.
The foundation translates the selector and navigation; other views are migrated
in subsequent changes. No complete bilingual-interface claim is made yet.

Run `bun run --cwd web i18n:check` to check both catalogs and locale selection.
Browser tests cover switching, pairing continuity, reload and a new service port.
