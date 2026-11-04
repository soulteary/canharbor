// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Auth, Capture, Session } from "./generated/api";
export function CapturePanel({
  auth,
  session,
}: {
  auth: Auth;
  session?: Session;
}) {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [duration, setDuration] = useState(3600);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{
    session: string;
    duration: number;
    id: string;
  } | null>(null);
  async function refresh() {
    const result = await api("captures", "/captures");
    setCaptures(result.captures);
  }
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const result = await api("captures", "/captures");
        if (alive) setCaptures(result.captures);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 2000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [auth.client_id]);
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  const validDuration =
    Number.isInteger(duration) && duration >= 1 && duration <= 86400;
  return (
    <section aria-label="Captures" className="capture-panel">
      <h2>Captures</h2>
      <p>
        Record one running acquisition. Recording ends when acquisition stops;
        it does not restart with the channel.
      </p>
      {error && <p role="alert">{error}</p>}
      <label>
        Recording duration (seconds)
        <input
          type="number"
          min="1"
          max="86400"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </label>
      <button
        disabled={busy || session?.state !== "running" || !validDuration}
        onClick={() =>
          void act(async () => {
            if (!session) return;
            if (
              pending.current?.session !== session.id ||
              pending.current?.duration !== duration
            )
              pending.current = {
                session: session.id,
                duration,
                id: crypto.randomUUID(),
              };
            await api(
              "capture",
              "/captures",
              "POST",
              {
                session_id: session.id,
                client_request_id: pending.current.id,
                max_duration_seconds: duration,
              },
              auth,
            );
            pending.current = null;
          })
        }
      >
        Start recording
      </button>
      {captures.length === 0 && <p>No recordings.</p>}
      <ul>
        {captures.map((capture) => {
          const active =
            capture.state === "starting" || capture.state === "recording";
          return (
            <li key={capture.id} data-capture-id={capture.id}>
              <code>{capture.id}</code> — {capture.state}; {capture.events}{" "}
              events; {capture.dropped} known drops
              {capture.loss_count_known ? "" : "; total loss unknown"};{" "}
              {capture.bytes} bytes
              {capture.reason && <span> ({capture.reason})</span>}
              {active ? (
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(() =>
                      api(
                        "capture",
                        `/captures/${capture.id}/stop`,
                        "POST",
                        {},
                        auth,
                      ),
                    )
                  }
                >
                  Stop recording
                </button>
              ) : (
                <>
                  <a
                    href={`/api/v1/captures/${capture.id}/download`}
                    download={`${capture.id}.ndjson`}
                  >
                    Download capture
                  </a>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(() =>
                        api(
                          "empty",
                          `/captures/${capture.id}`,
                          "DELETE",
                          {},
                          auth,
                        ),
                      )
                    }
                  >
                    Delete recording
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
