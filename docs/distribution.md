# Binary packages

The manually triggered **Package** workflow builds macOS ARM64 and Linux x86_64
archives with the browser workbench embedded. It uploads workflow artifacts;
without a release tag it does not create a release. Supplying an existing `v*`
tag to the workflow builds that exact tagged commit and prepares a **draft**
release containing both platform binaries, matching source and checksums. It
refuses to overwrite an already published release. Publication remains an
explicit maintainer action after acceptance. Download the archive for your platform from a
successful workflow run, extract it, then double-click `Start CANHarbor.command` on macOS or run
`./start-canharbor.sh` on Linux. The launcher reuses an existing default service
or starts one in the foreground; keep that window open. CLI alternative:

```sh
./canharbor serve --open
```

No Rust, Bun or Node.js installation is needed to run the binary. The default
service exposes two virtual channels. Hardware access remains opt-in and
unverified. Packages are unsigned and are not notarized; this workflow does not
establish compatibility with every macOS version or adapter.

Each binary archive includes the license, notices and a source revision. The
workflow also supplies a source archive from that same commit and SHA-256 files.
Before uploading, each platform verifies checksums, all source bytes and file
modes against the checked-out commit, binary architecture, licenses and launcher
permissions. It extracts the package into a path containing spaces and runs the
extracted CLI on its native runner: an isolated service on a random loopback
port, embedded HTML/JavaScript/CSS, launcher reuse and browser pairing, one
virtual CAN exchange, session cleanup and graceful shutdown. Only the OS
browser opener is stubbed; the test does not access physical adapters or open a
desktop browser. A failed verification blocks that platform's artifact upload
and the dependent draft-release job.
Compare the checksum with your download before running it. Workflow artifacts
have limited retention; they are not a permanent release channel.

## Local packaging

Build in a clean checkout using the pinned toolchain and Python 3.11 or later:

```sh
bun install --cwd web --frozen-lockfile
bun run --cwd web build
cargo build --release -p canharbor-cli --features web-ui --locked
python3 scripts/package.py --platform macos-arm64
```

Use `linux-x86_64` on that platform. Outputs are written to `dist/packages/`.
Packaging refuses source modifications or untracked files to keep the archived source reproducible. A clean checkout cannot prove that a
local binary was built from that commit; rebuild immediately before packaging. Use a fresh checkout so no source files are omitted.
The packager does not sign binaries, publish artifacts or include vendor libraries.

## Release acceptance

Published versions belong on [Releases](https://github.com/soulteary/canharbor/releases),
which is the stable download entry. Workflow artifacts remain a development fallback.
No published version or supported macOS release is asserted by this source tree.
Before publishing a draft, verify the extracted launcher, browser pairing,
virtual receive/send and clean shutdown on both packaged platforms, and record
the OS and browser versions. CI runs Chromium; set `CANHARBOR_BROWSER=webkit`
for a separate WebKit check. WebKit automation does not replace Safari acceptance.

The workflow currently produces unsigned packages. Apple signing and notarization
need the publisher's certificate, notarization credentials and a tested release
process. These external prerequisites cannot be satisfied by source changes alone.
