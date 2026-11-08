// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const runtime =
  process.env.CANHARBOR_TEST_RUNTIME ?? "/tmp/canharbor-playwright";
const cli = (...args: string[]) =>
  execFileSync(
    resolve("../target/debug/canharbor"),
    ["--runtime-dir", runtime, ...args],
    { encoding: "utf8" },
  ).trim();
test("recording names and source metadata survive browser refresh", async ({
  page,
}) => {
  await page.goto(cli("web", "open", "--print"));
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open channel", exact: true }).click();
  await page
    .getByRole("button", { name: "Acquire control", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start channel", exact: true })
    .click();
  await expect(page.getByText("running", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Recordings", exact: true }).click();
  const captures = page.getByRole("region", { name: "Captures", exact: true });
  await captures.getByLabel("Recording name (optional)").fill("Bench capture");
  await captures
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(
    captures.getByText("Bench capture", { exact: true }),
  ).toBeVisible();
  await captures
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Recordings", exact: true }).click();
  await expect(
    captures.getByText("Bench capture", { exact: true }),
  ).toBeVisible();
  await expect(captures).toContainText("virtual:0");
  await expect(captures).toContainText("Created:");
  page.once("dialog", (dialog) => dialog.accept());
  await captures
    .getByRole("button", { name: "Delete recording", exact: true })
    .click();
  await expect(
    captures.getByText("Bench capture", { exact: true }),
  ).toHaveCount(0);
  // Revoke the test browser identity and its remaining control lease.
  await page.evaluate(async () => {
    const auth = await (await fetch("/api/v1/auth/session")).json();
    await fetch("/api/v1/auth/session", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CANHarbor-CSRF": auth.csrf_token,
      },
    });
  });
});
