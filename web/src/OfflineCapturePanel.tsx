// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { inspectCapture, type OfflineCapture } from "./offline";
export function OfflineCapturePanel() {
  const [capture, setCapture] = useState<OfflineCapture | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function open(file?: File) {
    active.current?.abort();
    setCapture(null);
    setError("");
    if (!file) {
      setBusy(false);
      return;
    }
    if (file.size > 64 * 1024 * 1024) {
      setError("Capture exceeds 64 MiB");
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    try {
      const result = await inspectCapture(file.stream(), controller.signal);
      if (!controller.signal.aborted) setCapture(result);
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
        viewing does not open a channel or transmit traffic.
      </p>
      <label>
        Local capture file{" "}
        <input
          type="file"
          accept=".ndjson,.jsonl"
          onChange={(e) => {
            void open(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
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
          <p data-testid="offline-summary">
            {capture.complete ? "Complete recording" : "Incomplete recording"} ·{" "}
            {capture.frames} frames · {capture.diagnostics} diagnostics ·{" "}
            {capture.dropped} known dropped
            {capture.unknownLoss ? " · additional loss unknown" : ""}
            {capture.truncated ? " · partial final record excluded" : ""}
          </p>
          <p>
            Last {capture.preview.length} events (maximum 500). Received frames
            and diagnostics are observations, not a transmit plan.
          </p>
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
                {capture.preview.map((event) => (
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
