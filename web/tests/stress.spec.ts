import { nativeBinary } from "./native";
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Page } from "@playwright/test";
import { test, expect } from "./isolated-service";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { StressReport } from "../src/generated/api";
// Execution, durable evidence publication, and the browser's next poll are
// separate phases. A saving_* report is not a completed/verified report.
test.setTimeout(90000);
// These cases run real-time plans. A loaded host can stall the service past a
// slot deadline; the scheduler then skips the slot and the unchanged strict
// criteria fail that run, as they should. Cases that examine a run in which
// every slot was dispatched call requireCleanRun, which fails the attempt with
// a recorded reason when skipped slots are the only cause. Only such attempts
// are retried: a retry whose previous attempt left no record fails at once.
test.describe.configure({ retries: 3 });
const hostSkipRecord = (attempt: number) =>
  join(
    test.info().project.outputDir,
    ".host-skips",
    `${test.info().testId}-${attempt}`,
  );
test.beforeEach(() => {
  const attempt = test.info().retry;
  if (attempt > 0 && !existsSync(hostSkipRecord(attempt - 1)))
    throw new Error(
      "not retried: the previous attempt did not fail because of host scheduling",
    );
});
type Json = Record<string, any>;
/**
 * Deadlines missed by the host scheduler are the only reason this report did
 * not pass. Mirrors failed_only_by_host_skips in the server's stress tests:
 * evidence is complete and verified, nothing failed or is unknown, RTT
 * accounting is clean, and every unmet criterion follows from skipped slots.
 */
function failedOnlyByHostSkips(report: Json): boolean {
  return (
    report.evidence?.complete === true &&
    report.evidence?.error == null &&
    report.recovery?.status === "verified" &&
    report.recovery?.damaged_files === 0 &&
    skipsExplainFailure(report)
  );
}
function skipsExplainFailure(report: Json): boolean {
  if (
    report.verdict !== "fail" ||
    report.failed !== 0 ||
    report.unknown !== 0 ||
    report.counters_complete !== true ||
    !(report.skipped > 0)
  )
    return false;
  const rtt = report.rtt_report;
  if (
    rtt &&
    ([
      "timed_out",
      "cancelled",
      "duplicate_responses",
      "invalid_responses",
      "late_or_unmatched",
      "responder_failed",
      "responder_unknown",
    ].some((counter) => rtt[counter] !== 0) ||
      rtt.responder_submitted !== report.submitted ||
      rtt.latency?.samples !== report.submitted)
  )
    return false;
  const skipCriteria = [
    "min_submitted_ppm",
    "stage_min_submitted_ppm",
    "max_scheduler_skipped",
    "max_missing_expected_ppm",
  ];
  // In pattern traffic a data frame is verified against the checkpoint sent
  // in the slot before it, so a skipped checkpoint leaves it unverified.
  const criteriaFollowFromSkips = (assessment: Json | null) =>
    Array.isArray(assessment?.failures) &&
    assessment.failures.every(
      (failure: Json) =>
        skipCriteria.includes(failure.criterion) ||
        (report.plan?.traffic?.format === "classic_pattern_v1" &&
          failure.criterion === "max_missing_submitted_ppm" &&
          failure.actual <= report.skipped),
    );
  const flows: Json[] = report.group?.flows ?? [];
  const members: Json[] = [
    ...flows,
    ...((report.adaptive?.steps ?? []) as Json[]),
  ]
    .map((member) => member.report)
    .filter(Boolean);
  if (members.length === 0)
    return (
      report.state === "completed" &&
      report.measurement_complete === true &&
      Array.isArray(report.errors) &&
      report.errors.length === 0 &&
      criteriaFollowFromSkips(report.assessment)
    );
  // A parent stops or aborts once a member misses its criteria. The only
  // errors it may carry are the ones that follow from such a member.
  const skippedFlows = flows
    .filter((flow) => flow.report?.verdict !== "pass")
    .map((flow) => flow.name);
  const followsFromMember = (error: unknown) =>
    error ===
      "adaptive exploration ended: frozen_quality_or_workload_not_met" ||
    (typeof error === "string" &&
      error.startsWith("flow ") &&
      error.endsWith(" failed") &&
      skippedFlows.includes(error.slice(5, -7)));
  return (
    (report.assessment == null || criteriaFollowFromSkips(report.assessment)) &&
    Array.isArray(report.errors) &&
    report.errors.every(followsFromMember) &&
    (report.backend_cleanup ?? []).every(
      (channel: Json) =>
        channel.backend_unconfirmed === 0 && channel.failures?.length === 0,
    ) &&
    members.every(
      (member) => member.verdict === "pass" || skipsExplainFailure(member),
    )
  );
}
/**
 * Wait until the run has ended and its evidence is published, then fail this
 * attempt with a recorded reason if host skips alone made it miss its
 * criteria. Reads through the API context, so page routes do not apply.
 */
async function requireCleanRun(page: Page, id: string) {
  let report: Json = {};
  await expect
    .poll(
      async () => {
        const response = await page.request.get(
          `/api/v1/stress/runs/${id}/report`,
        );
        if (response.status() !== 200) return "unavailable";
        report = await response.json();
        return ["completed", "failed", "aborted"].includes(report.state) &&
          report.evidence?.complete === true &&
          report.recovery?.status === "verified"
          ? "published"
          : report.state;
      },
      { timeout: 60000, message: "wait for the run to end and be published" },
    )
    .toBe("published");
  if (!failedOnlyByHostSkips(report)) return;
  const record = hostSkipRecord(test.info().retry);
  mkdirSync(join(record, ".."), { recursive: true });
  writeFileSync(record, `${report.skipped}\n`);
  throw new Error(
    `host scheduler skipped ${report.skipped} slot(s), max dispatch lateness ${report.max_dispatch_lateness_ns} ns; this attempt is retried with a new run`,
  );
}
async function waitForSavedReport(
  page: Page,
  id: string,
  state: "completed" | "aborted" = "completed",
): Promise<StressReport> {
  let report!: StressReport;
  await expect
    .poll(
      async () => {
        report = await page.evaluate(async (runId) => {
          const response = await fetch(`/api/v1/stress/runs/${runId}/report`, {
            signal: AbortSignal.timeout(10000),
          });
          if (response.status !== 200)
            throw new Error(`report HTTP ${response.status}`);
          return response.json();
        }, id);
        return {
          state: report.state,
          complete: report.evidence.complete,
          verification: report.recovery?.status,
        };
      },
      {
        timeout: 30000,
        message: "wait for final state and verified durable evidence",
      },
    )
    .toEqual({ state, complete: true, verification: "verified" });
  await expect(
    page.getByTestId("stress-report").getByRole("heading", {
      level: 3,
      name: `Run ${id.slice(0, 8)} · ${state}`,
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  return report;
}
const cli = (runtime: string, ...args: string[]) =>
  execFileSync(nativeBinary, ["--runtime-dir", runtime, ...args], {
    encoding: "utf8",
  }).trim();
async function validateStressPlan(page: Page) {
  // Preflight captures executable provenance and may exceed the 5s UI assertion
  // budget on CI. Wait for that actual request, without retrying the mutation.
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/stress/validate") &&
        response.request().method() === "POST",
    ),
    page
      .getByRole("region", { name: "Stress testing" })
      .getByRole("button", { name: "Validate stress plan", exact: true })
      .click(),
  ]);
  expect(response.status()).toBe(200);
  await expect(page.getByTestId("stress-validation")).toBeVisible();
  return response.request().postDataJSON();
}
async function watchStressStart(page: Page) {
  let resolve!: (value: StressReport) => void;
  let reject!: (error: unknown) => void;
  const result = new Promise<StressReport>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  await page.route("**/api/v1/stress/runs", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    try {
      const response = await route.fetch();
      const value = await response.json();
      await route.fulfill({ response });
      resolve(value);
    } catch (error) {
      reject(error);
      await route.abort();
    }
  });
  return { result };
}
test.afterEach(async ({ page }) => {
  // An attempt refused by the retry gate above never opened the workbench.
  if (page.url() === "about:blank") return;
  await page.evaluate(async () => {
    const auth = await (await fetch("/api/v1/auth/session")).json();
    const list = await (await fetch("/api/v1/stress/runs")).json();
    for (const run of list.runs) {
      if (
        !["completed", "failed", "aborted", "interrupted"].includes(run.state)
      )
        continue;
      await fetch(`/api/v1/stress/runs/${run.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CANHarbor-CSRF": auth.csrf_token,
        },
      });
    }
    const logout = await fetch("/api/v1/auth/session", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CANHarbor-CSRF": auth.csrf_token,
      },
    });
    if (!logout.ok)
      throw new Error(`stress cleanup logout HTTP ${logout.status}`);
  });
});
test("virtual stress staircase persists evidence and refresh never restarts transmission", async ({
  page,
  isolatedRuntime,
  browser,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.scrollIntoViewIfNeeded();
  await expect(
    panel.getByRole("button", { name: "Start stress test", exact: true }),
  ).toBeDisabled();
  await panel
    .getByLabel("Stress sender", { exact: true })
    .selectOption("virtual:1");
  await panel
    .getByLabel("Stress sender", { exact: true })
    .selectOption("virtual:0");
  await panel
    .getByRole("checkbox", { name: "Virtual CAN 1", exact: true })
    .check();
  await panel
    .getByLabel("Stress workload", { exact: true })
    .selectOption("staircase");
  await panel.getByLabel("Stress stage rates", { exact: true }).fill("10,20");
  await panel.getByLabel("Stress stage seconds", { exact: true }).fill("1");
  await panel.getByLabel("Stress warmup seconds", { exact: true }).fill("0");
  // Reproduce the successful >5s preflight seen on Linux CI. Include server
  // time in the delay so this stays within the application's 10s API deadline.
  await page.route("**/api/v1/stress/validate", async (route) => {
    const started = Date.now();
    const response = await route.fetch();
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 5500 - (Date.now() - started))),
    );
    await route.fulfill({ response });
  });
  const submittedPlan = await validateStressPlan(page);
  await page.unroute("**/api/v1/stress/validate");
  expect(submittedPlan.sender).toBe("virtual:0");
  expect(submittedPlan.receivers).toEqual(["virtual:1"]);
  expect(submittedPlan.stages).toEqual([
    { name: "staircase-1", fps: 10, duration_seconds: 1, warmup_seconds: 0 },
    { name: "staircase-2", fps: 20, duration_seconds: 1, warmup_seconds: 0 },
  ]);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  let holdPublication = true;
  let savingResponses = 0;
  await page.route(
    /\/api\/v1\/stress\/runs\/[^/]+(?:\/report)?$/,
    async (route) => {
      const response = await route.fetch();
      const report = await response.json();
      if (report.state === "completed") {
        if (holdPublication) {
          savingResponses++;
          await route.fulfill({
            response,
            json: {
              ...report,
              state: "saving_completed",
              evidence: { ...report.evidence, complete: false },
              recovery: { ...report.recovery, status: "pending" },
            },
          });
          return;
        }
      }
      await route.fulfill({ response });
    },
  );
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const run = await started.result;
  await requireCleanRun(page, run.id);
  await expect(
    panel.getByTestId("stress-report").getByRole("heading", { level: 3 }),
  ).toHaveText(`Run ${run.id.slice(0, 8)} · saving_completed`, {
    timeout: 30000,
  });
  // The former substring assertion accepts saving_completed immediately.
  await expect(panel.getByTestId("stress-report")).toContainText("completed");
  let saved = false;
  const saving = waitForSavedReport(page, run.id).then((report) => {
    saved = true;
    return report;
  });
  try {
    // Deliberately keep persistence pending beyond the old 5 s evidence budget.
    // The gate, rather than wall-clock timing, controls publication.
    await new Promise((resolve) => setTimeout(resolve, 5500));
    expect(saved).toBe(false);
    await expect(
      panel.getByText(/Evidence verification: verified/),
    ).toHaveCount(0);
    expect(savingResponses).toBeGreaterThan(0);
  } finally {
    holdPublication = false;
    await saving;
  }
  await page.unroute(/\/api\/v1\/stress\/runs\/[^/]+(?:\/report)?$/);
  await expect(panel.getByTestId("stress-report")).toContainText(
    "Verdict: pass",
  );
  await expect(
    panel.getByText(/Evidence verification: verified/),
  ).toBeVisible();
  await expect(
    panel.getByRole("cell", { name: "virtual:1", exact: true }),
  ).toBeVisible();
  await panel.getByText("Evidence files", { exact: false }).click();
  await expect(
    panel.getByRole("link", { name: "manifest.json", exact: true }),
  ).toBeVisible();
  const before = JSON.parse(cli(isolatedRuntime, "stress", "list"));
  // Same-UID native operators can administer browser jobs, including long-running jobs.
  expect(before.runs.some((r: { id: string }) => r.id)).toBe(true);
  const reportLink = await panel
    .getByRole("link", { name: "report.json", exact: true })
    .getAttribute("href");
  expect(reportLink).toBeTruthy();
  const manifest = await (
    await page.request.get(reportLink!.replace("report.json", "manifest.json"))
  ).json();
  expect(manifest.complete).toBe(true);
  expect(manifest.plan.stages).toHaveLength(2);
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/stress/runs"))
      posts++;
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByTestId("stress-report")).toContainText("completed");
  expect(posts).toBe(0);
  await expect(
    page.getByLabel("Authorize stress transmission", { exact: true }),
  ).not.toBeChecked();
  const other = await browser.newPage();
  await other.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await other
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await other.getByText("Advanced stress settings", { exact: true }).click();
  await expect(
    other.getByText("Browser paired", { exact: true }),
  ).toBeVisible();
  const denied = await other.request.get(
    new URL(reportLink!, other.url()).href,
  );
  expect(denied.status()).toBe(404);
  await other.evaluate(async () => {
    const auth = await (await fetch("/api/v1/auth/session")).json();
    const logout = await fetch("/api/v1/auth/session", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CANHarbor-CSRF": auth.csrf_token,
      },
    });
    if (!logout.ok)
      throw new Error(`stress cleanup logout HTTP ${logout.status}`);
  });
  await other.close();
});
test("stress mutation requires CSRF and stop survives page reload", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const denied = await page.request.post("/api/v1/stress/runs", { data: {} });
  expect(denied.status()).toBe(403);
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.getByLabel("Stress frame count", { exact: true }).fill("10000");
  await panel.getByLabel("Stress target fps", { exact: true }).fill("10");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  await expect(panel.getByTestId("stress-report")).toBeVisible();
  // A definitive busy rejection clears the recovery key; it is not a lost create.
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText("a run is active");
  await expect(
    panel.getByRole("button", {
      name: "Recover stress start result",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByTestId("stress-report")).toBeVisible();
  await panel
    .getByRole("button", { name: "Stop stress test", exact: true })
    .click();
  await expect(panel.getByTestId("stress-report")).toContainText("aborted", {
    timeout: 10000,
  });
});
test("lost stress start response is recovered without another POST", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.getByLabel("Stress target fps", { exact: true }).fill("10");
  await panel.getByLabel("Stress frame count", { exact: true }).fill("10");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  let posts = 0;
  await page.route("**/api/v1/stress/runs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    posts++;
    await route.fetch(); // Commit the sole create request, then lose its response.
    await route.abort("failed");
  });
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  await expect(
    panel.getByRole("button", {
      name: "Recover stress start result",
      exact: true,
    }),
  ).toBeEnabled();
  await panel
    .getByRole("button", { name: "Recover stress start result", exact: true })
    .click();
  await expect(panel.getByTestId("stress-report")).toBeVisible();
  expect(posts).toBe(1);
  await page.unroute("**/api/v1/stress/runs");
  if (
    await panel
      .getByRole("button", { name: "Stop stress test", exact: true })
      .isEnabled()
  ) {
    await panel
      .getByRole("button", { name: "Stop stress test", exact: true })
      .click();
  }
  await expect(panel.getByTestId("stress-report")).toContainText(
    /aborted|completed/,
  );
});

test("FD mixed DLC and BRS uses CRC evidence and an explicit RTT responder", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.getByLabel("Stress protocol", { exact: true }).selectOption("fd");
  await panel.getByLabel("Stress FD lengths", { exact: true }).fill("32,48,64");
  await panel.getByLabel("Stress BRS", { exact: true }).selectOption("mixed");
  await panel.getByLabel("Stress RTT", { exact: true }).check();
  // Functional virtual RTT coverage, not a 100 ms CI-host latency benchmark.
  await panel.getByLabel("Stress RTT timeout", { exact: true }).fill("1000");
  await panel.getByLabel("Stress frame count", { exact: true }).fill("12");
  await panel.getByLabel("Stress target fps", { exact: true }).fill("20");
  await panel.getByLabel("Stress sample interval", { exact: true }).fill("1");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const run = await started.result;
  expect(run.plan.rtt?.timeout_ms).toBe(1000);
  await requireCleanRun(page, run.id);
  const saved = await waitForSavedReport(page, run.id);
  expect(saved.rtt_report?.latency.samples).toBe(12);
  expect(saved.rtt_report?.timed_out).toBe(0);
  expect(saved.rtt_report?.responder_submitted).toBe(12);
  expect(saved.rtt_report?.responder_failed).toBe(0);
  expect(saved.rtt_report?.responder_unknown).toBe(0);
  await expect(panel.getByTestId("stress-report")).toContainText(
    "Verdict: pass",
    { timeout: 15000 },
  );
  await expect(
    panel.getByText("Payload verification: crc32c_pattern_v1"),
  ).toBeVisible();
  await expect(
    panel.getByText(/RTT \(initiator host observations\): 12 samples/),
  ).toBeVisible();
  await expect(
    panel.getByText(/Evidence verification: verified/),
  ).toBeVisible();
  await panel.getByText("Evidence files", { exact: false }).click();
  const links = panel.getByRole("link");
  await expect(
    links.filter({ hasText: /^rtt-.*ndjson$/ }).first(),
  ).toBeVisible();
});

test("criteria changes invalidate validation and frozen criteria survive report recovery", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.scrollIntoViewIfNeeded();
  await panel.getByLabel("Stress frame count", { exact: true }).fill("5");
  await panel.getByLabel("Stress target fps", { exact: true }).fill("10");
  await panel.getByLabel("Enable stress host timing", { exact: true }).check();
  await panel
    .getByLabel("Stress timing sample interval", { exact: true })
    .fill("1");
  await panel.getByLabel("Stress timing window", { exact: true }).fill("2");
  await panel
    .getByLabel("Stress declared bus", { exact: true })
    .fill("Virtual bench");
  await panel
    .getByLabel("Stress role alias virtual:0", { exact: true })
    .fill("TX A");

  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Stress criterion max_duplicates", { exact: true })
    .fill("1");
  await expect(panel.getByTestId("stress-validation")).toHaveCount(0);
  await expect(
    panel.getByRole("button", { name: "Start stress test", exact: true }),
  ).toBeDisabled();
  // Returning to the old values must not resurrect the old validation.
  await panel
    .getByLabel("Stress criterion max_duplicates", { exact: true })
    .fill("0");
  await expect(panel.getByTestId("stress-validation")).toHaveCount(0);
  await panel
    .getByLabel("Stress criterion max_duplicates", { exact: true })
    .fill("1");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const run = await started.result;
  expect(run.plan.criteria?.max_duplicates).toBe(1);
  await requireCleanRun(page, run.id);
  await expect(panel.getByTestId("stress-assessment")).toContainText(
    "Criteria: met",
  );
  await expect
    .poll(async () =>
      (await page.request.get(`/api/v1/stress/runs/${run.id}`))
        .json()
        .then((v) => v.state),
    )
    .toBe("completed");
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(panel.getByTestId("stress-assessment")).toContainText(
    "Criteria: met",
  );
  const saved = await (
    await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
  ).json();
  expect(saved.version).toBe(8);
  expect(saved.plan.criteria.max_duplicates).toBe(1);
  expect(saved.assessment.failures).toEqual([]);
  expect(saved.verdict).toBe("pass");
  expect(saved.timing.receivers[0].matched).toBe(5);
  expect(saved.timing.request.worker_queue_unknown).toBe(5);
  expect(saved.provenance.executable.sha256).toMatch(/^[0-9a-f]{64}$/);
  expect(saved.plan.topology.bus).toBe("Virtual bench");
  await expect(panel.getByTestId("stress-timing")).toContainText(
    "matched 5 / 5",
  );
  await expect(panel.getByTestId("stress-timing")).toContainText(
    "worker_queue: p99 unknown, max unknown, n=0",
  );
  await panel
    .getByTestId("stress-provenance")
    .getByText("Software and selected library source evidence", { exact: true })
    .click();
  await expect(panel.getByTestId("stress-provenance")).toContainText("TX A");
});

test("bidirectional flows expose separate counters and stopping one preserves its peer", async ({
  page,
  isolatedRuntime,
  browser,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.scrollIntoViewIfNeeded();
  await panel.getByLabel("Stress frame count", { exact: true }).fill("20");
  await panel.getByLabel("Stress target fps", { exact: true }).fill("5");
  await panel
    .getByRole("button", { name: "Add reverse flow", exact: true })
    .click();
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-group-budget")).toContainText(
    "2 flows",
  );
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const run = await started.result;
  if (!run.plan.flows?.length) throw new Error("Missing concurrent flow");
  const name = run.plan.flows[0].name;
  const reverse = panel.getByTestId(`stress-flow-${name}`);
  await expect(reverse).toContainText("virtual:1 → virtual:0");
  await expect
    .poll(async () => {
      const r = await (
        await page.request.get(`/api/v1/stress/runs/${run.id}`)
      ).json();
      return r.group.flows.every(
        (f: { report: { submitted: number } }) => f.report.submitted >= 2,
      );
    })
    .toBe(true);
  const denied = await page.request.post(
    `/api/v1/stress/runs/${run.id}/flows/${name}/stop`,
    { data: {} },
  );
  expect(denied.status()).toBe(403);
  await reverse
    .getByRole("button", { name: `Stop flow ${name}`, exact: true })
    .click();
  await expect(reverse).toContainText("Stop requested at");
  await waitForSavedReport(page, run.id, "aborted");
  const saved = await (
    await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
  ).json();
  expect(saved.group.flows[0].report.submitted).toBe(20);
  expect(saved.group.flows[0].report.state).toBe("completed");
  expect(saved.group.flows[1].report.submitted).toBeLessThan(20);
  expect(saved.group.flows[1].report.submitted).toBeGreaterThanOrEqual(2);
  expect(saved.recovery.status).toBe("verified");
  expect(saved.verdict).not.toBe("pass");
  const other = await browser.newPage();
  await other.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await other
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await other.getByText("Advanced stress settings", { exact: true }).click();
  await expect(
    other.getByText("Browser paired", { exact: true }),
  ).toBeVisible();
  const unauthorized = await other.evaluate(
    async ({ id, name }) => {
      const auth = await (await fetch("/api/v1/auth/session")).json();
      const result = await fetch(
        `/api/v1/stress/runs/${id}/flows/${name}/stop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CANHarbor-CSRF": auth.csrf_token,
          },
          body: "{}",
        },
      );
      await fetch("/api/v1/auth/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CANHarbor-CSRF": auth.csrf_token,
        },
      });
      return result.status;
    },
    { id: run.id, name },
  );
  expect(unauthorized).toBe(404);
  await other.close();
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(panel.getByTestId("stress-flow-primary")).toContainText(
    "Submitted 20 / 20",
  );
  await expect(panel.getByTestId(`stress-flow-${name}`)).toContainText(
    "Stop requested at",
  );
  expect(
    (
      await (
        await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
      ).json()
    ).submitted,
  ).toBe(saved.submitted);
});

test("Classic pattern uses independent checkpoints and persists verified physical accounting", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.scrollIntoViewIfNeeded();
  await panel.getByLabel("Stress frame count", { exact: true }).fill("6");
  await panel.getByLabel("Stress target fps", { exact: true }).fill("4");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Stress protocol", { exact: true })
    .selectOption("pattern");
  await expect(panel.getByTestId("stress-validation")).toHaveCount(0);
  await expect(
    panel.getByLabel("Stress sample interval", { exact: true }),
  ).toHaveValue("1");
  await expect(
    panel.getByLabel("Stress sample interval", { exact: true }),
  ).toBeDisabled();
  await panel
    .getByLabel("Stress checkpoint CAN ID", { exact: true })
    .fill("125");
  await panel.getByLabel("Stress pattern window", { exact: true }).fill("2");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const run = await started.result;
  if (run.plan.traffic?.format !== "classic_pattern_v1")
    throw new Error("Missing Classic pattern plan");
  expect(run.plan.traffic.checkpoint_can_id).toBe(293);
  await requireCleanRun(page, run.id);
  await waitForSavedReport(page, run.id);
  await expect(panel.getByTestId("stress-classic-pattern")).toContainText(
    "Submitted checkpoints / data 3 / 3",
  );
  await expect(panel.getByTestId("stress-classic-pattern")).toContainText(
    "verified data 3",
  );
  const saved = await (
    await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
  ).json();
  expect(saved.version).toBe(9);
  expect(saved.verdict).toBe("pass");
  expect(saved.recovery.status).toBe("verified");
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(panel.getByTestId("stress-classic-pattern")).toContainText(
    "unverified data 0",
  );
  expect(
    (
      await (
        await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
      ).json()
    ).submitted,
  ).toBe(6);
});

test("adaptive exploration persists decisions and a separate fixed measurement", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.scrollIntoViewIfNeeded();
  await panel
    .getByLabel("Stress workload", { exact: true })
    .selectOption("adaptive");
  await panel.getByLabel("Stress adaptive rates", { exact: true }).fill("2,4");
  await panel
    .getByLabel("Stress adaptive explore seconds", { exact: true })
    .fill("1");
  await panel
    .getByLabel("Stress adaptive measure seconds", { exact: true })
    .fill("1");
  await panel
    .getByLabel("Stress adaptive observed ppm", { exact: true })
    .fill("800000");
  await panel
    .getByLabel("Stress load shape", { exact: true })
    .selectOption("burst");
  await panel.getByLabel("Stress burst frames", { exact: true }).fill("2");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Stress load shape", { exact: true })
    .selectOption("seeded");
  await expect(panel.getByTestId("stress-validation")).toHaveCount(0);
  await panel.getByLabel("Stress interval seed", { exact: true }).fill("42");
  await panel
    .getByLabel("Stress interval jitter", { exact: true })
    .fill("500000");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const run = await started.result;
  await requireCleanRun(page, run.id);
  await waitForSavedReport(page, run.id);
  await expect(panel.getByTestId("stress-adaptive")).toContainText(
    "selected rate 4 frames/s",
  );
  await expect(panel.getByTestId("stress-adaptive-measurement")).toContainText(
    "fixed_measurement_passed",
  );
  const saved = await (
    await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
  ).json();
  expect(saved.version).toBe(10);
  expect(saved.verdict).toBe("pass");
  expect(saved.recovery.status).toBe("verified");
  expect(saved.adaptive.steps).toHaveLength(3);
  expect(saved.adaptive.steps[2].report.plan.fps).toBe(4);
  expect(saved.adaptive.steps[2].report.plan.shape.seed).toBe(42);
  expect(saved.adaptive.steps[2].decision.actual_load.completed).toBe(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(panel.getByTestId("stress-adaptive-measurement")).toContainText(
    "input 4 physical frames/s",
  );
  expect(
    (
      await (
        await page.request.get(`/api/v1/stress/runs/${run.id}/report`)
      ).json()
    ).submitted,
  ).toBe(saved.submitted);
});

test("sliding tracking and receive queue observations persist and invalidate preflight", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByText("Browser paired", { exact: true })).toBeVisible();
  const panel = page.getByRole("region", { name: "Stress testing" });
  await panel.getByLabel("Stress frame count", { exact: true }).fill("160");
  await panel.getByLabel("Stress target fps", { exact: true }).fill("20");
  await panel.getByLabel("Stress tracking mode").selectOption("sliding");
  await panel.getByLabel("Stress tracking capacity").fill("64");
  await panel.getByLabel("Enable stress queue sampling").check();
  await panel.getByLabel("Stress queue sample interval").fill("3");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel.getByLabel("Stress tracking capacity").fill("128");
  await expect(
    panel.getByRole("button", { name: "Start stress test", exact: true }),
  ).toBeDisabled();
  await panel.getByLabel("Stress tracking capacity").fill("64");
  await validateStressPlan(page);
  await expect(panel.getByTestId("stress-validation")).toBeVisible();
  await panel.getByLabel("Authorize stress transmission").check();
  const started = await watchStressStart(page);
  await panel
    .getByRole("button", { name: "Start stress test", exact: true })
    .click();
  const created = await started.result;
  const saved = await waitForSavedReport(page, created.id);
  expect(saved.receivers[0].unique).toBe(saved.submitted);
  expect(saved.receivers[0].missing_submitted).toBe(0);
  const samples = Math.ceil(saved.submitted / 3);
  await expect(panel.getByTestId("stress-report")).toContainText(
    `Verdict: ${saved.skipped === 0 ? "pass" : "fail"}`,
  );
  await expect(panel.getByTestId("stress-resources")).toContainText(
    "history frozen",
  );
  await expect(panel.getByTestId("stress-resources")).toContainText(
    `residence samples ${samples}`,
  );
  await expect(
    panel.getByText(/Evidence verification: verified/),
  ).toBeVisible();
  await panel
    .getByText("Residence distribution · virtual:1", { exact: true })
    .click();
  await expect(
    panel.getByTestId("stress-residence-distribution"),
  ).toContainText(`Valid ${samples}`);
  await page.reload();
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await page.getByText("Advanced stress settings", { exact: true }).click();
  await expect(page.getByTestId("stress-resources")).toContainText(
    "sliding capacity 64",
  );
  await expect(
    page.getByLabel("Authorize stress transmission"),
  ).not.toBeChecked();
});

test("stress templates reset validation and require explicit authorization", async ({
  page,
  isolatedRuntime,
}) => {
  await page.goto(cli(isolatedRuntime, "web", "open", "--print"));
  await page
    .getByRole("button", { name: "Stress testing", exact: true })
    .click();
  await expect(
    page.getByText("Advanced stress settings", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Stress target fps", { exact: true }),
  ).toHaveValue("100");
  await validateStressPlan(page);
  await expect(page.getByTestId("stress-validation")).toBeVisible();
  await page
    .getByLabel("Authorize stress transmission", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "One-minute soak", exact: true })
    .click();
  await expect(page.getByLabel("Stress workload", { exact: true })).toHaveValue(
    "soak",
  );
  await expect(page.getByTestId("stress-validation")).toHaveCount(0);
  await expect(
    page.getByLabel("Authorize stress transmission", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Start stress test", exact: true }),
  ).toBeDisabled();
});
