// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from "@playwright/test";
// Keep the Unix socket below macOS's path length limit. CI owns this test-only path.
const runtime =
  process.env.CANHARBOR_TEST_RUNTIME ?? "/tmp/canharbor-playwright";
export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:32189",
    headless: true,
    browserName:
      process.env.CANHARBOR_BROWSER === "webkit" ? "webkit" : "chromium",
  },
  webServer: {
    command: `../target/debug/canharbor --runtime-dir ${runtime} serve --port 32189`,
    url: "http://127.0.0.1:32189/api/v1/version",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
