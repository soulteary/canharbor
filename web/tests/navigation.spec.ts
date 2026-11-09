// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "./isolated-service";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
test("reload aborts an in-flight task poll before the old page is discarded", async ({
  page,
  isolatedRuntime,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const fetch = window.fetch;
    window.fetch = (input, init) => {
      if (String(input).endsWith("/api/v1/tasks")) {
        init?.signal?.addEventListener(
          "abort",
          () => {
            sessionStorage.setItem(
              "task-poll-aborted",
              init.signal!.reason.name,
            );
          },
          { once: true },
        );
      }
      return fetch(input, init);
    };
  });
  await page.goto(
    execFileSync(
      resolve("../target/debug/canharbor"),
      ["--runtime-dir", isolatedRuntime, "web", "open", "--print"],
      { encoding: "utf8" },
    ).trim(),
  );
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.evaluate(() => sessionStorage.removeItem("task-poll-aborted"));
    let intercepted!: () => void;
    const pending = new Promise<void>((resolve) => (intercepted = resolve));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let held = false;
    const holdPoll = async (route: import("@playwright/test").Route) => {
      if (held) return route.continue();
      held = true;
      intercepted();
      await gate;
      await route.abort().catch(() => {}); // The old document may already be gone.
    };
    await page.route("**/api/v1/tasks", holdPoll);
    try {
      // Force the race instead of hoping a fast local request overlaps reload.
      await pending;
      await page.reload();
      await expect(
        page.getByText("Browser paired", { exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => sessionStorage.getItem("task-poll-aborted")),
      ).toBe("AbortError");
      const response = await page.waitForResponse((response) =>
        response.url().endsWith("/api/v1/tasks"),
      );
      expect(response.status()).toBe(200);
      expect(pageErrors).toEqual([]);
    } finally {
      release();
      await page.unroute("**/api/v1/tasks", holdPoll);
    }
  }
  // A bfcache-restored document keeps this module: its aborted lifetime must
  // be renewed rather than permanently disabling subsequent API requests.
  const restoredPoll = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/tasks"),
  );
  await page.evaluate(() => {
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    );
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  expect((await restoredPoll).status()).toBe(200);
  expect(pageErrors).toEqual([]);
});
