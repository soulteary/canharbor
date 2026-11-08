// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import {
  indexCapture,
  indexedCapturePage,
  type CaptureIndex,
  MAX_LOCAL_CAPTURE_BYTES,
  type OfflineCapture,
} from "./offline";
export function OfflineCapturePanel({
  recordingFile,
}: {
  recordingFile?: File | null;
}) {
  const [capture, setCapture] = useState<OfflineCapture | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [idFilter, setIdFilter] = useState("");
  const [direction, setDirection] = useState("all");
  const [filename, setFilename] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [offset, setOffset] = useState(0);
  const [readingPage, setReadingPage] = useState(false);
  const [progress, setProgress] = useState(0);
  const [applied, setApplied] = useState({ id: "", direction: "all" });
  const [jumpPage, setJumpPage] = useState("1");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const indexRef = useRef<CaptureIndex | null>(null);
  const visibleEvents = capture?.preview ?? [];
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (!recordingFile) return;
    indexRef.current = null;
    setCapture(null);
    setFile(recordingFile);
    setIdFilter("");
    setDirection("all");
    void scan(recordingFile);
  }, [recordingFile]);
  async function scan(
    file: File | undefined,
    nextOffset = 0,
    filters = { id: "", direction: "all" },
  ) {
    active.current?.abort();
    setFilename(file?.name ?? "");
    setProgress(0);
    setError("");
    if (!file) {
      setBusy(false);
      return;
    }
    if (file.size > MAX_LOCAL_CAPTURE_BYTES) {
      setError("Capture exceeds 1 GiB");
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    try {
      const typedFilters = {
        id: filters.id,
        direction: filters.direction as "all" | "rx" | "tx",
      };
      let index = indexRef.current;
      setReadingPage(
        !!index &&
          index.source === file &&
          JSON.stringify(index.filters) === JSON.stringify(typedFilters),
      );
      if (
        !index ||
        index.source !== file ||
        JSON.stringify(index.filters) !== JSON.stringify(typedFilters)
      ) {
        index = await indexCapture(
          file,
          controller.signal,
          typedFilters,
          (bytes) =>
            setProgress(Math.min(100, Math.floor((bytes / file.size) * 100))),
        );
        if (!controller.signal.aborted) indexRef.current = index;
      }
      const preview =
        nextOffset === 0
          ? index.summary.preview
          : await indexedCapturePage(index, nextOffset, controller.signal);
      const result = { ...index.summary, preview };
      if (!controller.signal.aborted) {
        setCapture(result);
        setOffset(nextOffset);
        setJumpPage(String(Math.floor(nextOffset / 100) + 1));
        setApplied(filters);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="offline-panel" aria-label="Offline capture viewer">
      <h2>Offline capture</h2>
      <p>
        Inspect a local NDJSON recording. The file stays in this browser;
        viewing does not open a channel or transmit traffic. Maximum file size:
        1 GiB. The initial scan validates the whole file and builds a bounded
        index. Pages use that index; changing filters builds a new index.
      </p>
      <label>
        Local capture file{" "}
        <input
          type="file"
          accept=".ndjson,.jsonl"
          onChange={(e) => {
            indexRef.current = null;
            setCapture(null);
            const selected = e.target.files?.[0];
            setFile(selected ?? null);
            setIdFilter("");
            setDirection("all");
            void scan(selected);
            e.target.value = "";
          }}
        />
      </label>
      {busy && (
        <p role="status">
          {readingPage
            ? "Reading indexed page…"
            : `Validating file: ${progress}%`}
        </p>
      )}
      {busy && (
        <button
          onClick={() => {
            active.current?.abort();
            setBusy(false);
          }}
        >
          Cancel inspection
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {capture && (
        <>
          <p>File: {filename}</p>
          <p>
            Integrity: whole-file validation finished. Page navigation does not
            change this result.
          </p>
          <p data-testid="offline-summary">
            {capture.complete ? "Complete recording" : "Incomplete recording"} ·{" "}
            {capture.frames} frames · {capture.diagnostics} diagnostics ·{" "}
            {capture.dropped} known dropped
            {capture.unknownLoss ? " · additional loss unknown" : ""}
            {capture.truncated ? " · partial final record excluded" : ""}
          </p>
          <p>
            Showing {capture.preview.length} events, up to 100 per page.
            Received frames and diagnostics are observations, not a transmit
            plan.
          </p>
          <label>
            Filter ID (hex, contains)
            <input
              value={idFilter}
              onChange={(e) => setIdFilter(e.target.value)}
              spellCheck={false}
            />
          </label>
          <label>
            Direction
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="all">All events</option>
              <option value="rx">RX</option>
              <option value="tx">TX</option>
            </select>
          </label>
          <button
            disabled={busy}
            onClick={() =>
              void scan(file ?? undefined, 0, { id: idFilter, direction })
            }
          >
            Apply filters
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setIdFilter("");
              setDirection("all");
              void scan(file ?? undefined, 0);
            }}
          >
            Reset filters
          </button>
          <p>
            {capture.matched} matching events across the whole recording. Page{" "}
            {Math.floor(offset / 100) + 1}.
          </p>
          {capture.matched === "0" && (
            <p role="status">
              No events match these filters. Reset filters to inspect all
              events.
            </p>
          )}
          <label>
            Time display
            <select
              value={timeUnit}
              onChange={(event) => setTimeUnit(event.target.value)}
            >
              <option value="seconds">Monotonic seconds</option>
              <option value="ns">Raw monotonic nanoseconds</option>
            </select>
          </label>
          <div>
            <button
              disabled={busy || offset === 0}
              onClick={() =>
                void scan(file ?? undefined, Math.max(0, offset - 100), applied)
              }
            >
              Previous page
            </button>
            <button
              disabled={busy || BigInt(offset + 100) >= BigInt(capture.matched)}
              onClick={() =>
                void scan(file ?? undefined, offset + 100, applied)
              }
            >
              Next page
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const page = Number(jumpPage);
              if (
                Number.isSafeInteger(page) &&
                page >= 1 &&
                page <= Math.max(1, Math.ceil(Number(capture.matched) / 100))
              )
                void scan(file ?? undefined, (page - 1) * 100, applied);
            }}
          >
            <label>
              Jump to page
              <input
                type="number"
                min="1"
                max={Math.max(1, Math.ceil(Number(capture.matched) / 100))}
                value={jumpPage}
                onChange={(event) => setJumpPage(event.target.value)}
              />
            </label>
            <button
              disabled={
                busy ||
                !Number.isInteger(Number(jumpPage)) ||
                Number(jumpPage) < 1 ||
                Number(jumpPage) >
                  Math.max(1, Math.ceil(Number(capture.matched) / 100))
              }
            >
              Go to page
            </button>
          </form>
          <div className="offline-table">
            <table>
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>
                    {timeUnit === "ns"
                      ? "Monotonic time (ns)"
                      : "Monotonic time (s)"}
                  </th>
                  <th>Direction</th>
                  <th>ID / diagnostic</th>
                  <th>Data</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((event) => (
                  <tr key={event.sequence}>
                    <td>{event.sequence}</td>
                    <td
                      title={`Raw monotonic time: ${event.host_monotonic_ns} ns`}
                    >
                      {timeUnit === "ns"
                        ? event.host_monotonic_ns
                        : `${BigInt(event.host_monotonic_ns) / 1000000000n}.${(BigInt(event.host_monotonic_ns) % 1000000000n).toString().padStart(9, "0")}`}
                    </td>
                    <td>
                      {event.type === "frame_received"
                        ? event.direction.toUpperCase()
                        : "DIAGNOSTIC"}
                    </td>
                    <td>
                      {event.type === "frame_received"
                        ? event.frame.id.toString(16).toUpperCase()
                        : `Error classes ${event.error_classes}`}
                    </td>
                    <td>
                      {event.type === "frame_received"
                        ? event.frame.data_hex
                        : event.raw_data_hex}
                    </td>
                    <td>
                      {event.timestamp_quality} · epoch {event.timestamp_epoch}{" "}
                      · raw us {event.device_raw_timestamp_us ?? "unknown"} ·
                      device us {event.device_timestamp_us ?? "unknown"}
                      {event.type === "frame_received"
                        ? ` · ${event.frame.kind} · ${event.frame.extended ? "EXT" : "STD"} · BRS ${event.frame.brs} · DLC ${event.frame.dlc} · raw DLC ${event.raw_dlc ?? "unknown"} · ESI ${event.frame.esi}`
                        : ` · overflow ${event.overflow}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
