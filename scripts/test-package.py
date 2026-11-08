#!/usr/bin/env python3
"""Exercise package/source identity and launchers in an isolated clean checkout."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import unittest


class PackageTest(unittest.TestCase):
    def test_archives_and_launchers(self):
        repository = Path(__file__).resolve().parents[1]
        for platform in ("macos-arm64", "linux-x86_64"):
            with self.subTest(platform=platform), tempfile.TemporaryDirectory(prefix="canharbor package ") as temporary:
                root = Path(temporary)
                (root / "scripts").mkdir()
                shutil.copy2(repository / "scripts/package.py", root / "scripts/package.py")
                for name in ("LICENSE", "THIRD_PARTY_NOTICES"):
                    shutil.copy2(repository / name, root / name)
                shutil.copytree(repository / "LICENSES", root / "LICENSES")
                (root / ".gitignore").write_text("/target/\n/dist/\n")
                for command in (["git", "init", "-q"], ["git", "add", "."],
                                ["git", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "-c", "user.name=Package Test", "-c", "user.email=package-test@example.invalid", "commit", "-qm", "fixture"]):
                    subprocess.run(command, cwd=root, check=True, capture_output=True)
                binary = root / "target/release/canharbor"
                binary.parent.mkdir(parents=True)
                binary.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$CANHARBOR_LAUNCH_LOG"\n'
                                  'if [ "$1" = devices ]; then exit "$CANHARBOR_SERVICE_EXISTS"; fi\n')
                binary.chmod(0o755)
                subprocess.run(["python3", "scripts/package.py", "--platform", platform], cwd=root, check=True, capture_output=True)
                packages = root / "dist/packages"
                archives = list(packages.glob("*.tar.gz"))
                self.assertEqual(len(archives), 2)
                for archive in archives:
                    checksum = archive.with_suffix(".gz.sha256").read_text().split()[0]
                    self.assertEqual(checksum, hashlib.sha256(archive.read_bytes()).hexdigest())
                binary_archive = next(path for path in archives if platform in path.name)
                extract = root / "extracted with spaces"
                with tarfile.open(binary_archive) as archive:
                    archive.extractall(extract, filter="data")
                folder = next(extract.iterdir())
                revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
                self.assertIn("Source revision: " + revision, (folder / "START.txt").read_text())
                self.assertIn(revision[:12], binary_archive.name)
                with tarfile.open(next(path for path in archives if "source" in path.name)) as source:
                    self.assertIn("canharbor-source/scripts/package.py", source.getnames())
                launcher = folder / ("Start CANHarbor.command" if platform == "macos-arm64" else "start-canharbor.sh")
                self.assertTrue(os.access(launcher, os.X_OK))
                log = root / "launcher.log"
                env = {**os.environ, "CANHARBOR_LAUNCH_LOG": str(log)}
                for service_exists, expected in (("1", ["devices", "serve --open"]), ("0", ["devices", "web open"])):
                    log.unlink(missing_ok=True)
                    subprocess.run([str(launcher)], cwd="/tmp", env={**env, "CANHARBOR_SERVICE_EXISTS": service_exists}, check=True, capture_output=True)
                    self.assertEqual(log.read_text().splitlines(), expected)
                (root / "uncommitted.txt").write_text("dirty")
                rejected = subprocess.run(["python3", "scripts/package.py", "--platform", platform], cwd=root, capture_output=True)
                self.assertNotEqual(rejected.returncode, 0)


if __name__ == "__main__":
    unittest.main()
