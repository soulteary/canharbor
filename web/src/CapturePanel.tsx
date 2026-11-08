// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { ErrorRecovery } from "./ErrorRecovery";
import type { Auth, Capture, Session } from "./generated/api";
function readableBytes(value: string) {
  const bytes = BigInt(value);
  if (bytes < 1024n) return `${bytes} B`;
  if (bytes < 1048576n)
    return `${Number(bytes) / 1024 >= 10 ? (Number(bytes) / 1024).toFixed(0) : (Number(bytes) / 1024).toFixed(1)} KiB`;
  return `${(Number(bytes) / 1048576).toFixed(1)} MiB`;
}
export function CapturePanel({
  auth,
  session,
}: {
  auth: Auth;
  session?: Session;
}) {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(3600);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [editing, setEditing] = useState<{
    id: string;
    original: string;
    name: string;
  } | null>(null);
  const pending = useRef<{
    session: string;
    duration: number;
    name: string;
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
        if (alive) setError(e);
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
    setError(null);
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(e);
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
      {error != null && (
        <ErrorRecovery
          error={error}
          context="recording"
          busy={busy}
          onCheck={() => void act(refresh)}
          onDismiss={() => setError(null)}
        />
      )}
      <label>
        Recording name (optional)
        <input
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bench run"
        />
      </label>
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
              pending.current?.duration !== duration ||
              pending.current?.name !== name.trim()
            )
              pending.current = {
                session: session.id,
                duration,
                name: name.trim(),
                id: crypto.randomUUID(),
              };
            await api(
              "capture",
              "/captures",
              "POST",
              {
                session_id: session.id,
                name: pending.current.name,
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
      <p>
        {session
          ? `Selected source: ${session.channel_id} · session ${session.id}`
          : "Select a session in the connection panel first."}
        {session && session.state !== "running"
          ? " Start the channel before recording."
          : ""}
      </p>
      {!validDuration && (
        <p role="alert">Enter a duration from 1 to 86400 seconds.</p>
      )}
      {captures.length === 0 && <p>No recordings.</p>}
      <label>
        Filter recordings by name
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <label>
        Filter recordings by channel
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option value="">All channels</option>
          {[...new Set(captures.map((c) => c.channel_id ?? "unknown"))]
            .sort()
            .map((channel) => (
              <option key={channel} value={channel}>
                {channel === "unknown" ? "Unknown channel" : channel}
              </option>
            ))}
        </select>
      </label>
      <ul>
        {captures
          .filter(
            (c) =>
              (!channelFilter ||
                (c.channel_id ?? "unknown") === channelFilter) &&
              (c.name || "Unnamed recording")
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
          )
          .map((capture) => {
            const active =
              capture.state === "starting" || capture.state === "recording";
            return (
              <li key={capture.id} data-capture-id={capture.id}>
                <strong>{capture.name || "Unnamed recording"}</strong>{" "}
                <code>{capture.id}</code> — {capture.state}; {capture.events}{" "}
                events; {capture.dropped} known drops
                {capture.loss_count_known ? "" : "; total loss unknown"};{" "}
                <span title={`${capture.bytes} bytes`}>
                  {readableBytes(capture.bytes)}
                </span>
                <p>
                  Source session: <code>{capture.session_id}</code>
                  {capture.channel_id ? ` · ${capture.channel_id}` : ""}
                  {capture.created_unix_ms && (
                    <>
                      {" "}
                      · Created:{" "}
                      {new Date(
                        Number(capture.created_unix_ms),
                      ).toLocaleString()}
                    </>
                  )}
                  {" · "}Duration deadline:{" "}
                  {new Date(Number(capture.expires_unix_ms)).toLocaleString()}
                </p>
                {capture.reason && <span> ({capture.reason})</span>}
                {editing?.id === capture.id ? (
                  <div>
                    <label>
                      New recording name
                      <input
                        value={editing.name}
                        maxLength={120}
                        onChange={(e) =>
                          setEditing({ ...editing, name: e.target.value })
                        }
                      />
                    </label>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          await api(
                            "capture",
                            `/captures/${capture.id}`,
                            "PATCH",
                            {
                              name: editing.name.trim(),
                              expected_name: editing.original,
                            },
                            auth,
                          );
                          setEditing(null);
                        })
                      }
                    >
                      Save recording name
                    </button>
                    <button disabled={busy} onClick={() => setEditing(null)}>
                      Cancel rename
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() =>
                      setEditing({
                        id: capture.id,
                        original: capture.name,
                        name: capture.name,
                      })
                    }
                  >
                    Rename recording
                  </button>
                )}
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
                      download
                    >
                      Download capture
                    </a>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Delete recording "${capture.name || "Unnamed recording"}" (${capture.id})? This removes the stored file.`,
                          )
                        )
                          return;
                        void act(() =>
                          api(
                            "empty",
                            `/captures/${capture.id}`,
                            "DELETE",
                            {},
                            auth,
                          ),
                        );
                      }}
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
