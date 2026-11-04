// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import { validateFrame } from "../src/api";
const binary = resolve("../target/debug/canharbor");
const runtime =
  process.env.CANHARBOR_TEST_RUNTIME ?? "/tmp/canharbor-playwright";
const cli = (...args: string[]) =>
  execFileSync(binary, ["--runtime-dir", runtime, ...args], {
    encoding: "utf8",
  }).trim();
test("frame inputs preserve exact ID and CAN FD wire constraints", () => {
  expect(() => validateFrame("fd_data", "800", false, "", false, 0)).toThrow();
  expect(() =>
    validateFrame("fd_data", "123", false, "00".repeat(9), false, 0),
  ).toThrow();
  expect(
    validateFrame("fd_data", "1FFFFFFF", true, "00".repeat(12), true, 0).id,
  ).toBe(0x1fffffff);
});
test("browser receives CLI traffic and CLI receives browser traffic", async ({
  page,
  browser,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const pairing = cli("web", "open", "--print");
  await page.goto(pairing);
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  await expect(page).toHaveURL("http://127.0.0.1:32189/");
  await page
    .getByRole("combobox", { name: "Channel", exact: true })
    .selectOption("virtual:1");
  await page.getByRole("button", { name: "Open channel", exact: true }).click();
  await page
    .getByRole("button", { name: "Acquire control", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start channel", exact: true })
    .click();
  await expect(page.getByText("running", { exact: true })).toBeVisible();
  await expect(page.getByText("Live", { exact: true })).toBeVisible();
  expect(
    cli(
      "send",
      "--channel",
      "virtual:0",
      "--id",
      "321",
      "--data",
      "AABB",
      "--active",
    ),
  ).toContain("virtual_bus_accepted");
  await expect(
    page.getByRole("cell", { name: "321", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "AA BB", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pause display", exact: true })
    .click();
  cli(
    "send",
    "--channel",
    "virtual:0",
    "--id",
    "322",
    "--data",
    "CC",
    "--active",
  );
  await expect(
    page.getByRole("cell", { name: "322", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Resume display", exact: true })
    .click();
  await page.getByRole("button", { name: "Close", exact: true }).click();

  const monitor = spawn(binary, [
    "--runtime-dir",
    runtime,
    "monitor",
    "--channel",
    "virtual:1",
    "--listen-only",
    "--count",
    "1",
  ]);
  let output = "";
  let stderr = "";
  monitor.stdout.on("data", (chunk) => (output += chunk));
  monitor.stderr.on("data", (chunk) => (stderr += chunk));
  const exited = new Promise<number | null>((resolve) =>
    monitor.on("exit", resolve),
  );
  try {
    await expect
      .poll(() =>
        JSON.parse(cli("session", "list")).sessions.some(
          (s: { channel_id: string; state: string }) =>
            s.channel_id === "virtual:1" && s.state === "running",
        ),
      )
      .toBe(true);
    await page
      .getByRole("combobox", { name: "Channel", exact: true })
      .selectOption("virtual:0");
    await page
      .getByRole("combobox", { name: "Mode", exact: true })
      .selectOption("active");
    await page
      .getByRole("button", { name: "Open channel", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Acquire control", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start channel", exact: true })
      .click();
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
    await page.getByLabel("Identifier").fill("456");
    await page.getByLabel("Payload").fill("DE AD BE EF");
    await page.getByRole("button", { name: "Send once", exact: false }).click();
    await expect(page.getByRole("status")).toContainText(
      "Submitted to virtual bus",
    );
    await expect.poll(() => output).toContain("DEADBEEF");
    expect(await exited, stderr).toBe(0);
    const received = JSON.parse(output.trim());
    expect(received.frame.id).toBe(0x456);
    expect(received.direction).toBe("rx");
  } finally {
    if (monitor.exitCode === null) monitor.kill("SIGINT");
  }
  // A second authenticated client may observe but cannot acquire the first client's lease.
  const context = await browser.newContext();
  const observer = await context.newPage();
  await observer.goto(cli("web", "open", "--print"));
  await expect(
    observer.getByText("Browser paired", { exact: true }),
  ).toBeVisible();
  await observer
    .getByRole("combobox", { name: "Session", exact: true })
    .selectOption(
      await page
        .getByRole("combobox", { name: "Session", exact: true })
        .inputValue(),
    );
  await expect(
    observer.getByRole("button", { name: "Acquire control", exact: true }),
  ).toBeDisabled();
  await context.close();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/workbench.png", fullPage: true });
  await page.reload();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send once", exact: false }),
  ).toBeDisabled();
  expect(pageErrors).toEqual([]);
});
