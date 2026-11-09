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

The core connection, channel configuration, live monitor, frame submission,
hardware guidance and operation recovery views use translated resources. Notices
retain message keys and interpolation values so an existing notice changes
language with the page. Known API failures have translated summaries; raw service
details remain available separately. Number and time formatting use the selected
UI locale. Recording, offline analysis, tasks, stress testing and CLI output remain
for subsequent changes.

Core browser regressions switch an active virtual session between both languages
and verify that its configuration, WebSocket, received rows and invalid frame
draft survive. Switching does not pair again or submit a frame. An unpaired
browser can also translate existing recovery guidance.

Recording, offline analysis and periodic tasks now use both catalogs. Recording
names and file content remain user data. Offline validation keeps the error object
so an existing error follows language changes. Task admission and recovery notices
retain message keys. Tests check preserved drafts, raw frame columns, offline
filters and task results, with one admission across both languages.

Stress-plan controls, flow editing, verification summaries and charts use the
selected language. Frozen plans, hashes, JSON evidence and technical identifiers
retain their original representation. The bilingual regression checks one
validation and one admission, unchanged plan/hash/authorization across switching,
and continuity of an active virtual run.
