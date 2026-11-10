// SPDX-License-Identifier: AGPL-3.0-or-later
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
export const nativeBinary = resolve(
  `../target/debug/canharbor${process.platform === "win32" ? ".exe" : ""}`,
);
export const nativeRuntime =
  process.env.CANHARBOR_TEST_RUNTIME ??
  join(
    process.platform === "win32" ? tmpdir() : "/tmp",
    "canharbor-playwright",
  );
export function temporaryRuntime(prefix: string): string {
  return mkdtempSync(
    join(process.platform === "win32" ? tmpdir() : "/tmp", prefix),
  );
}
