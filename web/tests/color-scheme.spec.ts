import { nativeBinary } from "./native";
// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "./isolated-service";
import { execFileSync } from "node:child_process";
import type { Page } from "@playwright/test";

// Relative luminance and contrast as defined by WCAG 2.
function luminance(color: string): number {
  const [r, g, b] = color
    .match(/[\d.]+/g)!
    .slice(0, 3)
    .map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(first: string, second: string): number {
  const [high, low] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return (high + 0.05) / (low + 0.05);
}
async function colors(page: Page) {
  return page.evaluate(() => {
    const style = (selector: string) =>
      getComputedStyle(document.querySelector(selector)!);
    return {
      page: style("html").backgroundColor,
      text: style("html").color,
      sidebar: style(".sidebar").backgroundColor,
      sidebarText: style(".sidebar").color,
      primary: style("button.primary").backgroundColor,
      primaryText: style("button.primary").color,
      activeView: style('nav.workbench-views button[aria-pressed="true"]')
        .backgroundColor,
      activeViewText: style('nav.workbench-views button[aria-pressed="true"]')
        .color,
    };
  });
}
test("the dark colour scheme follows the system preference", async ({
  page,
  isolatedRuntime,
}) => {
  const pairing = execFileSync(
    nativeBinary,
    ["--runtime-dir", isolatedRuntime, "web", "open", "--print"],
    { encoding: "utf8" },
  ).trim();
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(pairing);
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const light = await colors(page);
  expect(luminance(light.page)).toBeGreaterThan(0.8);

  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await colors(page);
  expect(luminance(dark.page)).toBeLessThan(0.05);
  expect(contrast(dark.text, dark.page)).toBeGreaterThan(7);
  expect(contrast(dark.primaryText, dark.primary)).toBeGreaterThan(4.5);
  expect(contrast(dark.activeViewText, dark.activeView)).toBeGreaterThan(4.5);
  // The sidebar is dark in both schemes and does not change.
  expect(dark.sidebar).toBe(light.sidebar);
  expect(dark.sidebarText).toBe(light.sidebarText);
});
