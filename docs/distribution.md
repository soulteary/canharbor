# Binary packages

The manually triggered **Package** workflow builds macOS ARM64 and Linux x86_64
archives with the browser workbench embedded. It uploads workflow artifacts;
it does not publish a release. Download the archive for your platform from a
successful workflow run, extract it, then run:

```sh
./canharbor serve --open
```

No Rust, Bun or Node.js installation is needed to run the binary. The default
service exposes two virtual channels. Hardware access remains opt-in and
unverified. Packages are unsigned and are not notarized; this workflow does not
establish compatibility with every macOS version or adapter.

Each binary archive includes the license, notices and a source revision. The
workflow also supplies a source archive from that same commit and SHA-256 files.
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
