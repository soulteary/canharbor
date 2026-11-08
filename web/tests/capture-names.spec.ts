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
  await captures
    .getByRole("button", { name: "Rename recording", exact: true })
    .click();
  await captures.getByLabel("New recording name").fill("Renamed bench");
  await captures
    .getByRole("button", { name: "Save recording name", exact: true })
    .click();
  await expect(
    captures.getByText("Renamed bench", { exact: true }),
  ).toBeVisible();
  await captures.getByLabel("Filter recordings by name").fill("not present");
  await expect(
    captures.getByText("Renamed bench", { exact: true }),
  ).toHaveCount(0);
  await captures.getByLabel("Filter recordings by name").fill("renamed");
  await captures
    .getByLabel("Filter recordings by channel")
    .selectOption("virtual:0");
  const downloaded = page.waitForEvent("download");
  await captures
    .getByRole("link", { name: "Download capture", exact: true })
    .click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(
    /^Renamed bench_virtual_0_\d+_[a-f0-9-]+\.ndjson$/,
  );
  await page.reload();
  await page.getByRole("button", { name: "Recordings", exact: true }).click();
  await expect(
    captures.getByText("Renamed bench", { exact: true }),
  ).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain('"Renamed bench"');
    await dialog.accept();
  });
  await captures
    .getByRole("button", { name: "Delete recording", exact: true })
    .click();
  await expect(
    captures.getByText("Renamed bench", { exact: true }),
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
