// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import {
  inspectCapture,
  MAX_LOCAL_CAPTURE_BYTES,
  type OfflineCapture,
} from "./offline";
export function OfflineCapturePanel() {
  const [capture, setCapture] = useState<OfflineCapture | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [idFilter, setIdFilter] = useState("");
  const [direction, setDirection] = useState("all");
  const [filename, setFilename] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [offset, setOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [applied, setApplied] = useState({ id: "", direction: "all" });
  const visibleEvents = capture?.preview ?? [];
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
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
      const result = await inspectCapture(
        file.stream(),
        controller.signal,
        100,
        {
          offset: nextOffset,
          id: filters.id,
          direction: filters.direction as "all" | "rx" | "tx",
          onProgress: (bytes) =>
            setProgress(Math.min(100, Math.floor((bytes / file.size) * 100))),
        },
      );
      if (!controller.signal.aborted) {
        setCapture(result);
        setOffset(nextOffset);
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
        1 GiB. Each page or filter change scans the whole file with bounded
        memory.
      </p>
      <label>
        Local capture file{" "}
        <input
          type="file"
          accept=".ndjson,.jsonl"
          onChange={(e) => {
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
      {busy && <p role="status">Scanning file: {progress}%</p>}
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
          <p>
            {capture.matched} matching events across the whole recording. Page{" "}
            {Math.floor(offset / 100) + 1}.
          </p>
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
          <div className="offline-table">
            <table>
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>Time (ns)</th>
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
                    <td>{event.host_monotonic_ns}</td>
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
