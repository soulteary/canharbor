// SPDX-License-Identifier: AGPL-3.0-or-later
import { decode } from "./contract";
import type { BusEvent } from "./generated/api";
const MAX_BYTES = 64 * 1024 * 1024;
export const MAX_LOCAL_CAPTURE_BYTES = 1024 * 1024 * 1024;
export interface CapturePageOptions {
  offset: number;
  id?: string;
  direction?: "all" | "rx" | "tx";
  onProgress?: (bytes: number) => void;
}
const REASONS = [
  "queue_full",
  "source_gap",
  "size_limit",
  "io_error",
  "disk_full",
  "owner_dropped",
  "session_stopped",
  "invalid_event",
  "duration_limit",
];
export interface OfflineCapture {
  complete: boolean;
  truncated: boolean;
  events: string;
  frames: string;
  diagnostics: string;
  dropped: string;
  unknownLoss: boolean;
  preview: BusEvent[];
  matched: string;
}
function counter(value: unknown): bigint {
  return BigInt(decode("counter", value));
}
function reason(value: unknown): boolean {
  return typeof value === "string" && REASONS.includes(value);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid capture record");
  return value as Record<string, unknown>;
}
/** Inspect local bytes only. Bounded lines/preview; no API, lease or device access. */
export async function inspectCapture(
  source: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
  limit = 500,
  page?: CapturePageOptions,
): Promise<OfflineCapture> {
  if (!Number.isInteger(limit) || limit < 0 || limit > 500)
    throw new Error("Preview limit exceeds 500");
  if (page && (!Number.isSafeInteger(page.offset) || page.offset < 0))
    throw new Error("Invalid page offset");
  const id = page?.id?.trim().replace(/^0x/i, "").toUpperCase() ?? "";
  if (id && !/^[0-9A-F]+$/.test(id))
    throw new Error("Enter a hexadecimal ID filter");
  let matched = 0;
  let header = false,
    footer = false,
    complete = false,
    gaps = false,
    unknownLoss = false;
  let events = 0n,
    frames = 0n,
    diagnostics = 0n,
    dropped = 0n;
  let previous: [bigint, bigint] | undefined;
  const preview: BusEvent[] = [];
  function consume(bytes: number[]) {
    if (footer) throw new Error("Content after capture footer");
    const record = object(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)),
      ),
    );
    switch (record.record) {
      case "header":
        if (header || record.schema_version !== 1)
          throw new Error("Capture schema or record order");
        for (const key of [
          "capture_id",
          "owner",
          "server_instance_id",
          "session_epoch",
          "created_unix_ms",
        ])
          if (typeof record[key] !== "string")
            throw new Error("Invalid capture header");
        if (!("config" in record))
          throw new Error("Missing capture configuration");
        counter(record.created_unix_ms);
        header = true;
        break;
      case "event": {
        if (!header) throw new Error("Missing capture header");
        const message = decode("stream_message", {
          type: "events",
          server_instance_id: "offline",
          session_epoch: "offline",
          events: [record.event],
        });
        if (message.type !== "events")
          throw new Error("Invalid captured event");
        const event = message.events[0];
        if (event.type === "frame_received") {
          const frame = event.frame;
          decode("frame_input", {
            kind: frame.kind,
            id: frame.id,
            extended: frame.extended,
            brs: frame.brs,
            data_hex: frame.data_hex,
            dlc: frame.dlc,
          });
          if (
            (event.raw_dlc != null &&
              (!Number.isInteger(event.raw_dlc) ||
                event.raw_dlc < 0 ||
                event.raw_dlc > 15 ||
                (frame.kind === "fd_data"
                  ? event.raw_dlc
                  : Math.min(event.raw_dlc, 8)) !== frame.dlc)) ||
            (frame.esi && frame.kind !== "fd_data")
          )
            throw new Error("Invalid captured frame metadata");
          frames++;
        } else {
          if (
            event.raw_data_hex.length > 128 ||
            !/^(?:[0-9a-fA-F]{2})*$/.test(event.raw_data_hex)
          )
            throw new Error("Invalid diagnostic bytes");
          diagnostics++;
        }
        const sequence = counter(event.sequence),
          time = counter(event.host_monotonic_ns);
        if (previous && (sequence <= previous[0] || time < previous[1]))
          throw new Error("Capture sequence or time moved backwards");
        previous = [sequence, time];
        events++;
        const matches =
          !page ||
          (event.type === "frame_received"
            ? (!page.direction ||
                page.direction === "all" ||
                event.direction === page.direction) &&
              event.frame.id.toString(16).toUpperCase().includes(id)
            : (!page.direction || page.direction === "all") && !id);
        if (matches) {
          if (limit) {
            if (page) {
              if (matched >= page.offset && preview.length < limit)
                preview.push(event);
            } else {
              if (preview.length === limit) preview.shift();
              preview.push(event);
            }
          }
          matched++;
        }
        break;
      }
      case "gap":
        if (!header || !reason(record.cause))
          throw new Error("Invalid capture gap");
        gaps = true;
        if (record.count == null) unknownLoss = true;
        else {
          dropped += counter(record.count);
          if (dropped > 18446744073709551615n)
            throw new Error("Gap count overflow");
        }
        break;
      case "footer": {
        if (
          !header ||
          typeof record.complete !== "boolean" ||
          (record.reason != null && !reason(record.reason))
        )
          throw new Error("Invalid capture footer");
        const count = counter(record.dropped);
        if (
          counter(record.events) !== events ||
          (unknownLoss ? count < dropped : count !== dropped)
        )
          throw new Error("Capture footer count mismatch");
        if (record.complete && (record.reason != null || gaps || count > 0n))
          throw new Error("Inconsistent capture footer");
        dropped = count;
        complete = record.complete;
        footer = true;
        break;
      }
      default:
        throw new Error("Unsupported capture record");
    }
  }
  const reader = source.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", cancel, { once: true });
  let bytes = 0,
    records = 0;
  let line: number[] = [];
  try {
    if (signal?.aborted) throw new Error("Inspection cancelled");
    while (true) {
      if (signal?.aborted) throw new Error("Inspection cancelled");
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > (page ? MAX_LOCAL_CAPTURE_BYTES : MAX_BYTES))
        throw new Error(
          page ? "Capture exceeds 1 GiB" : "Capture exceeds 64 MiB",
        );
      page?.onProgress?.(bytes);
      for (const byte of value) {
        if (footer) throw new Error("Content after capture footer");
        line.push(byte);
        if (line.length > 8192)
          throw new Error("Capture record exceeds 8192 bytes");
        if (byte === 10) {
          consume(line);
          line = [];
          if (++records % 128 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
            if (signal?.aborted) throw new Error("Inspection cancelled");
          }
        }
      }
    }
    if (signal?.aborted) throw new Error("Inspection cancelled");
    if (!header) throw new Error("Missing capture header");
    return {
      complete: complete && !line.length,
      truncated: !!line.length,
      events: String(events),
      frames: String(frames),
      diagnostics: String(diagnostics),
      dropped: String(dropped),
      unknownLoss,
      preview,
      matched: String(matched),
    };
  } finally {
    signal?.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
