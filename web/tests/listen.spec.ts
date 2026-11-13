import { nativeBinary } from "./native";
// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "./isolated-service";
import { execFileSync } from "node:child_process";
test("open and listen starts a listen-only channel in one step", async ({
  page,
  isolatedRuntime,
}) => {
  const cli = (...args: string[]) =>
    execFileSync(nativeBinary, ["--runtime-dir", isolatedRuntime, ...args], {
      encoding: "utf8",
    });
  await page.goto(cli("web", "open", "--print").trim());
  const origin = new URL(page.url()).origin;
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Channel", exact: true })
    .selectOption("virtual:1");
  const listen = page.getByRole("button", {
    name: "Open and listen",
    exact: true,
  });
  await listen.click();
  await expect(
    page.getByText("You have control", { exact: true }),
  ).toBeVisible();
  const selection = page.getByRole("combobox", {
    name: "Session",
    exact: true,
  });
  await expect(selection).not.toHaveValue("");
  const id = await selection.inputValue();
  await expect
    .poll(async () => {
      const response = await page.request.get(
        `${origin}/api/v1/sessions/${id}`,
      );
      return (await response.json()).state;
    })
    .toBe("running");
  const session = await (
    await page.request.get(`${origin}/api/v1/sessions/${id}`)
  ).json();
  expect(session.config.mode).toBe("listen_only");
  expect(session.controller).not.toBeNull();

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
    page.getByRole("cell", { name: "AA BB", exact: true }),
  ).toBeVisible();

  // The shortcut is for listening only; active mode keeps the explicit steps.
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(selection).toHaveValue("");
  await page
    .getByRole("combobox", { name: "Mode", exact: true })
    .selectOption("active");
  await expect(listen).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open channel", exact: true }),
  ).toBeEnabled();
});
