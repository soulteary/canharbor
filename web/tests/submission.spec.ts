// SPDX-License-Identifier: AGPL-3.0-or-later
import { expect, test } from "@playwright/test";
import { ApiFailure, boundedJson } from "../src/api";
import { decode } from "../src/contract";
test("submission uncertainty requires explicit outcome metadata or a rejection status", () => {
  const detail = decode("error", {
    error: {
      code: "failed",
      message: "failed",
      retryable: false,
      request_id: "fixture",
      outcome_unknown: false,
    },
  }).error;
  for (const status of [400, 401, 403, 404, 409, 412, 422, 428, 429]) {
    expect(new ApiFailure(status).unknown).toBe(false);
    expect(new ApiFailure(status, detail, true).unknown).toBe(true);
  }
  expect(new ApiFailure(503).unknown).toBe(true);
  expect(new ApiFailure(503, detail).unknown).toBe(true);
  expect(new ApiFailure(503, detail, false).unknown).toBe(false);
});
test("API JSON reader bounds streamed response bytes and rejects malformed UTF-8", async () => {
  expect(await boundedJson(new Response('{"ok":true}'))).toEqual({ ok: true });
  await expect(
    boundedJson(new Response(new Uint8Array([255]))),
  ).rejects.toThrow();
  await expect(
    boundedJson(new Response("x".repeat(1024 * 1024 + 1))),
  ).rejects.toThrow("1 MiB");
});
