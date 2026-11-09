// SPDX-License-Identifier: AGPL-3.0-or-later
import { test as base, expect } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
export const test = base.extend<{ isolatedRuntime: string }>({
  // APIRequestContext resolves relative URLs against baseURL, not page.url().
  // Keep API assertions on the same service as the paired browser.
  baseURL: async ({ isolatedRuntime }, use) => {
    const pairing = execFileSync(
      resolve("../target/debug/canharbor"),
      ["--runtime-dir", isolatedRuntime, "web", "open", "--print"],
      { encoding: "utf8" },
    ).trim();
    await use(new URL(pairing).origin);
  },
  isolatedRuntime: async ({}, use) => {
    const runtime = mkdtempSync("/tmp/ch-ux-");
    const binary = resolve("../target/debug/canharbor");
    const service = spawn(
      binary,
      ["--runtime-dir", runtime, "serve", "--port", "0"],
      {
        stdio: "ignore",
        env: { ...process.env, CANHARBOR_CONFIG_DIR: `${runtime}/preferences` },
      },
    );
    const exited = new Promise((resolve) => service.once("exit", resolve));
    try {
      await expect
        .poll(() => {
          try {
            execFileSync(binary, ["--runtime-dir", runtime, "devices"], {
              stdio: "ignore",
            });
            return true;
          } catch {
            return false;
          }
        })
        .toBe(true);
      await use(runtime);
    } finally {
      service.kill("SIGTERM");
      await exited;
      rmSync(runtime, { recursive: true, force: true });
    }
  },
});

export { expect };
