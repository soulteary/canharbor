// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "@playwright/test";
import { decode } from "../src/contract";
import fixtures from "../../api/fixtures.json" with { type: "json" };
test("shared frame fixtures agree with the generated runtime schema", () => {
  for (const frame of fixtures.valid_frames)
    expect(() => decode("frame_input", frame)).not.toThrow();
  for (const frame of fixtures.invalid_frames)
    expect(() => decode("frame_input", frame)).toThrow();
});
test("stream schema rejects unknown variants and numeric 64-bit counters", () => {
  const payload = {
    type: "events",
    server_instance_id: "srv",
    session_epoch: "s1",
    events: [
      {
        type: "frame_received",
        sequence: "9007199254740993",
        host_monotonic_ns: "18446744073709551615",
        direction: "rx",
        timestamp_quality: "host_only",
        frame: {
          kind: "classic_data",
          id: 1,
          extended: false,
          brs: false,
          data_hex: "",
          dlc: 0,
        },
      },
    ],
  };
  const typed = decode("stream_message", payload);
  if (typed.type !== "events") throw new Error("wrong discriminator");
  expect(BigInt(typed.events[0].sequence)).toBe(9007199254740993n);
  expect(() =>
    decode("stream_message", {
      ...payload,
      events: [{ ...payload.events[0], sequence: 9007199254740992 }],
    }),
  ).toThrow();
  expect(() => decode("stream_message", { type: "unknown" })).toThrow();
  expect(() =>
    decode("stream_message", {
      type: "events",
      server_instance_id: "srv",
      session_epoch: "s1",
    }),
  ).toThrow();
  expect(() => decode("auth", { client_id: "missing-token" })).toThrow();
  expect(() =>
    decode("auth", { client_id: "native", csrf_token: null }),
  ).not.toThrow();
});
test("counter schema enforces canonical u64 limits without number conversion", () => {
  for (const value of fixtures.valid_counters)
    expect(() => decode("counter", value)).not.toThrow();
  for (const value of fixtures.invalid_counters)
    expect(() => decode("counter", value)).toThrow();
});
test("response additions are tolerated while unknown request fields are rejected", () => {
  expect(() =>
    decode("auth", {
      client_id: "native",
      csrf_token: null,
      new_server_field: true,
    }),
  ).not.toThrow();
  expect(() =>
    decode("subscribe", {
      type: "subscribe",
      protocol_version: "1.0",
      typo: true,
    }),
  ).toThrow();
});
