// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  api,
  ApiFailure,
  validateFrame,
  type Auth,
  type BusEvent,
  type Device,
  type Session,
  type Frame,
} from "./api";
import "./style.css";
import { ErrorRecovery } from "./ErrorRecovery";
import { TransmissionActions } from "./TransmissionActions";
import { OfflineCapturePanel } from "./OfflineCapturePanel";
import { StressPanel } from "./StressPanel";
import { TaskPanel } from "./TaskPanel";
import { CapturePanel } from "./CapturePanel";
import { decode } from "./contract";
import type { SessionMode, CreateRequest, Subscribe } from "./generated/api";
type FrameBusEvent = Extract<BusEvent, { type: "frame_received" }>;
const MAX_ROWS = 500;
// Capture once, before React effects. The code never reaches storage or request URLs.
const pairCode = new URLSearchParams(location.hash.slice(1)).get("pair");
if (location.hash) history.replaceState(null, "", location.pathname);
const draftKey = "canharbor.workbench.v1";
function readDraft(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw || raw.length > 8192) return {};
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
const savedDraft = readDraft();
const draftString = (key: string, fallback: string) =>
  typeof savedDraft[key] === "string"
    ? (savedDraft[key] as string).slice(0, 2048)
    : fallback;
function App() {
  const [workspace, setWorkspace] = useState(
    ["live", "capture", "offline", "stress"].includes(
      draftString("workspace", "live"),
    )
      ? draftString("workspace", "live")
      : "live",
  );
  const [auth, setAuth] = useState<Auth | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const selectionRestored = useRef(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState(draftString("selectedId", ""));
  const [channel, setChannel] = useState("virtual:0");
  const [mode, setMode] = useState<SessionMode>("listen_only");
  const [nominalBitrate, setNominalBitrate] = useState(500000);
  const [fdEnabled, setFdEnabled] = useState(false);
  const [dataBitrate, setDataBitrate] = useState(2000000);
  const selectedDevice = devices.find((device) =>
    device.channels.some((item) => item.id === channel),
  );
  const selectedChannel = selectedDevice?.channels.find(
    (item) => item.id === channel,
  );
  const [error, setError] = useState<unknown>(null);
  const pairAttempted = useRef(false);
  const [lastQuery, setLastQuery] = useState<number | null>(null);
  const [queryStale, setQueryStale] = useState(true);
  const [lastRenewal, setLastRenewal] = useState<number | null>(null);
  const [renewalUnknown, setRenewalUnknown] = useState(false);
  const [streamSegments, setStreamSegments] = useState(0);
  const monitoredSession = useRef<string | null>(null);
  const [connectionBusy, setConnectionBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamState, setStreamState] = useState("Disconnected");
  const [streamRevision, setStreamRevision] = useState(0);
  const [idFilter, setIdFilter] = useState(draftString("idFilter", ""));
  const [directionFilter, setDirectionFilter] = useState(
    ["all", "rx", "tx"].includes(draftString("directionFilter", "all"))
      ? draftString("directionFilter", "all")
      : "all",
  );
  const [rows, setRows] = useState<FrameBusEvent[]>([]);
  const [received, setReceived] = useState(0);
  const [diagnostics, setDiagnostics] = useState<
    Extract<BusEvent, { type: "bus_diagnostic" }>[]
  >([]);
  const [gaps, setGaps] = useState(0n);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const pending = useRef<FrameBusEvent[]>([]);
  const receivedRef = useRef(0);
  const elapsedOrigin = useRef<string | null>(null);
  const [kind, setKind] = useState<Frame["kind"]>(
    ["classic_data", "classic_remote", "fd_data"].includes(
      draftString("kind", "classic_data"),
    )
      ? (draftString("kind", "classic_data") as Frame["kind"])
      : "classic_data",
  );
  const [id, setId] = useState(draftString("id", "123"));
  const [data, setData] = useState(draftString("data", "01 02 03 04"));
  const [extended, setExtended] = useState(savedDraft.extended === true);
  const [brs, setBrs] = useState(savedDraft.brs === true);
  const [dlc, setDlc] = useState(
    typeof savedDraft.dlc === "number" &&
      Number.isInteger(savedDraft.dlc) &&
      savedDraft.dlc >= 0 &&
      savedDraft.dlc <= 8
      ? savedDraft.dlc
      : 0,
  );
  // A page must explicitly acquire control, even if the shared cookie already owns a lease.
  const [lease, setLease] = useState<{
    id: string;
    generation: string;
    renewAt: number;
  } | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          workspace,
          selectedId,
          idFilter,
          directionFilter,
          kind,
          id,
          data,
          extended,
          brs,
          dlc,
        }),
      );
    } catch {
      /* Storage may be unavailable. */
    }
  }, [
    workspace,
    selectedId,
    idFilter,
    directionFilter,
    kind,
    id,
    data,
    extended,
    brs,
    dlc,
  ]);
  const leaseRef = useRef(lease);
  leaseRef.current = lease;
  const authRef = useRef(auth);
  authRef.current = auth;
  async function checkStatus() {
    setConnectionBusy(true);
    try {
      if (!authRef.current) {
        const current = await api("auth", "/auth/session");
        setAuth(current);
      }
      await refresh();
      const result = await api("devices", "/devices");
      setDevices(result.devices);
      setError(null);
    } catch (e) {
      setQueryStale(true);
      reportError(e);
    } finally {
      setConnectionBusy(false);
    }
  }
  const session = sessions.find((s) => s.id === selectedId);
  const controls =
    !!session &&
    !!lease &&
    lease.id === session.id &&
    lease.generation === session.generation &&
    session.controller === auth?.client_id;
  const validNominal =
    selectedDevice?.simulated ||
    (Number.isInteger(nominalBitrate) &&
      nominalBitrate >= 1 &&
      nominalBitrate <= 10000000);
  const validData =
    !fdEnabled ||
    selectedDevice?.simulated ||
    (Number.isInteger(dataBitrate) &&
      dataBitrate >= 1 &&
      dataBitrate <= 20000000);
  const configValid = validNominal && validData;
  let frameError = "";
  try {
    validateFrame(kind, id, extended, data, brs, dlc);
    if (
      kind === "fd_data" &&
      (!selectedChannel?.fd || session?.config.data_bitrate == null)
    )
      frameError =
        "Enable CAN FD in the selected session before sending an FD frame.";
  } catch (e) {
    frameError = e instanceof Error ? e.message : String(e);
  }
  const visibleRows = rows.filter(
    (row) =>
      (!idFilter.trim() ||
        row.frame.id.toString(16).toUpperCase() ===
          idFilter
            .trim()
            .replace(/^0x/i, "")
            .toUpperCase()
            .replace(/^0+(?=.)/, "")) &&
      (directionFilter === "all" || row.direction === directionFilter),
  );
  const sendBlocked = !auth
    ? "Pair this browser to use the workbench."
    : renewalUnknown
      ? "Control renewal outcome is unknown. Check final status before sending."
      : !session
        ? "Open or select a channel session first."
        : !controls
          ? session.controller
            ? "This session is controlled elsewhere. Wait for control to be released."
            : "Acquire control of the selected session."
          : session.mode !== "active"
            ? "Stop the channel, choose Active mode, and apply settings to enable transmission."
            : session.state !== "running"
              ? "Start the selected channel."
              : streamState !== "Live"
                ? "Reconnect the event stream before sending."
                : busy
                  ? "Wait for the current operation to finish."
                  : frameError;
  async function refreshDevices() {
    const result = await api("devices", "/devices");
    setDevices(result.devices);
    if (!result.devices.some((d) => d.channels.some((c) => c.id === channel))) {
      if (lease) {
        setNotice(
          "The selected device is unavailable. Close its session before choosing another channel.",
        );
        return;
      }
      setChannel(result.devices.flatMap((d) => d.channels)[0]?.id ?? "");
      setSelectedId("");
      setLease(null);
      setFdEnabled(false);
      setNominalBitrate(500000);
      setDataBitrate(2000000);
    }
  }
  async function refresh() {
    const queriedLease = leaseRef.current;
    const result = await api("sessions", "/sessions");
    setSessions(result.sessions);
    setLastQuery(Date.now());
    setQueryStale(false);
    const owned = queriedLease;
    if (owned && leaseRef.current === queriedLease) {
      const current = result.sessions.find((item) => item.id === owned.id);
      if (
        !current ||
        current.generation !== owned.generation ||
        current.controller !== authRef.current?.client_id
      )
        setLease(null);
    }
    const restored = result.sessions.find((item) => item.id === selectedId);
    if (restored && !selectionRestored.current) {
      selectionRestored.current = true;
      setChannel(restored.channel_id);
      setMode(restored.config.mode);
      setNominalBitrate(restored.config.nominal_bitrate);
      setFdEnabled(restored.config.data_bitrate !== null);
      setDataBitrate(restored.config.data_bitrate ?? 2000000);
    }
  }
  function reportError(error: unknown) {
    setError(error);
    if (error instanceof ApiFailure && error.status === 401) {
      setAuth(null);
      setLease(null);
    } else if (error instanceof ApiFailure && error.status === 403) {
      setLease(null);
    }
  }
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let alive = true;
    setConnectionBusy(true);
    (async () => {
      try {
        const usePair = !!pairCode && !pairAttempted.current;
        pairAttempted.current = true;
        const current = usePair
          ? await api("auth", "/auth/pair", "POST", { code: pairCode })
          : await api("auth", "/auth/session");
        if (!alive) return;
        setAuth(current);
        const result = await api("devices", "/devices");
        if (!alive) return;
        setDevices(result.devices);
        await refresh();
      } catch (e) {
        if (alive) reportError(e);
      } finally {
        if (alive) setConnectionBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!auth) return;
    const timer = setInterval(() => {
      refresh().catch((e) => {
        setQueryStale(true);
        reportError(e);
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [auth]);
  useEffect(() => {
    if (!auth || !lease) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    setRenewalUnknown(false);
    const renew = async () => {
      const started = performance.now();
      try {
        await api(
          "session",
          `/sessions/${lease.id}/lease/renew`,
          "POST",
          {},
          auth,
          lease.generation,
        );
        if (active) {
          setLastRenewal(Date.now());
          setRenewalUnknown(false);
        }
      } catch (e) {
        if (active) {
          reportError(e);
          if (
            e instanceof ApiFailure &&
            [401, 403, 404, 409, 412, 428].includes(e.status)
          )
            setLease(null);
          else setRenewalUnknown(true);
        }
        return;
      }
      // Anchor each renewal to its request, not a possibly delayed response.
      // Keep one request in flight and never reacquire an expired lease.
      if (active)
        timer = setTimeout(
          renew,
          Math.max(0, started + 5000 - performance.now()),
        );
    };
    timer = setTimeout(renew, Math.max(0, lease.renewAt - performance.now()));
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [auth, lease]);
  useEffect(() => {
    if (monitoredSession.current !== selectedId) {
      monitoredSession.current = selectedId;
      setLastRenewal(null);
      pending.current = [];
      elapsedOrigin.current = null;
      pausedRef.current = false;
      setPaused(false);
      setRows([]);
      receivedRef.current = 0;
      setReceived(0);
      setGaps(0n);
      setDiagnostics([]);
      setStreamSegments(0);
    } else if (selectedId && auth) {
      setStreamSegments((n) => n + 1);
    }
    if (!auth || !selectedId) {
      setStreamState("Disconnected");
      return;
    }
    let active = true;
    const socket = new WebSocket(
      `${location.origin.replace("http:", "ws:")}/api/v1/sessions/${selectedId}/stream`,
    );
    setStreamState("Connecting");
    socket.onopen = () =>
      socket.send(
        JSON.stringify({
          type: "subscribe",
          protocol_version: "1.0",
          csrf_token: auth.csrf_token,
          filter: {},
        } satisfies Subscribe),
      );
    socket.onmessage = (event) => {
      try {
        const message = decode("stream_message", JSON.parse(event.data));
        if (message.type === "hello") setStreamState("Live");
        else if (message.type === "gap") {
          setGaps((n) => n + BigInt(message.count));
        } else if (message.type === "events") {
          const batch = message.events.filter(
            (item): item is FrameBusEvent => item.type === "frame_received",
          );
          const diagnosticBatch = message.events.filter(
            (item): item is Extract<BusEvent, { type: "bus_diagnostic" }> =>
              item.type === "bus_diagnostic",
          );
          if (diagnosticBatch.length)
            setDiagnostics((old) => [...old, ...diagnosticBatch].slice(-64));
          if (elapsedOrigin.current === null && batch.length)
            elapsedOrigin.current = batch[0].host_monotonic_ns;
          receivedRef.current += batch.length;
          if (!pausedRef.current)
            pending.current = [...pending.current, ...batch].slice(-MAX_ROWS);
        } else if (message.type === "session_fault") {
          setError(
            `Channel fault: ${message.code}. Acquire control and start explicitly after recovery.`,
          );
          setLease(null);
          socket.close();
        } else if (message.type === "resume_unavailable") {
          setNotice(
            "Stream history is unavailable. Select the session again to subscribe.",
          );
          socket.close();
        } else {
          const unhandled: never = message;
          throw new Error(`Unsupported stream message: ${unhandled}`);
        }
      } catch {
        setError("Invalid stream message.");
        socket.close();
      }
    };
    socket.onclose = () => {
      if (active) {
        setStreamState("Disconnected");
        setQueryStale(true);
        setNotice(
          "Stream closed. Reconnect explicitly; transmission is not resumed.",
        );
      }
    };
    socket.onerror = () => {
      if (active) setError("Could not open the event stream.");
    };
    const flush = setInterval(() => {
      setReceived(receivedRef.current);
      if (pending.current.length) {
        const batch = pending.current;
        pending.current = [];
        setRows((old) => [...old, ...batch].slice(-MAX_ROWS));
      }
    }, 100);
    return () => {
      active = false;
      clearInterval(flush);
      socket.close();
    };
  }, [selectedId, auth, streamRevision]);
  function togglePause() {
    pausedRef.current = !paused;
    setPaused(!paused);
    pending.current = [];
  }
  async function control(path: string) {
    if (!session || !lease || !auth) return;
    await api(
      "session",
      `/sessions/${session.id}/${path}`,
      "POST",
      {},
      auth,
      lease.generation,
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="/">
          CAN<span>Harbor</span>
          <small>LOCAL WORKBENCH</small>
        </a>
        <div className="stage">LOCAL CAN WORKBENCH</div>
        <nav>
          <a href="#workspace" className="active">
            Workspace <span>01</span>
          </a>
          <a href="#devices">
            Devices <span>{devices.length}</span>
          </a>
          <a href="#workspace" onClick={() => setWorkspace("stress")}>
            Stress testing
          </a>
          <a href="#about">About & source</a>
        </nav>
        <div className="side-footer">
          <span className={`dot ${auth ? "connected" : ""}`} />
          <span>{auth ? "Browser paired" : "Pairing required"}</span>
          <p>Local access · No cloud connection</p>
        </div>
      </aside>
      <main id="workspace">
        <header>
          <div>
            <div className="eyebrow">CAN / CAN FD PLATFORM</div>
            <h1>Bus workspace</h1>
            <p>
              Inspect traffic and send frames through the local Rust service.
            </p>
          </div>
          <span className="simulation">
            <span className="dot" />
            {devices.every((device) => device.simulated)
              ? "Simulation only"
              : "Hardware access enabled · unverified"}
          </span>
        </header>
        {diagnostics.length > 0 && (
          <section aria-label="Bus diagnostics">
            <h2>Bus diagnostics</h2>
            <ul>
              {diagnostics.map((item) => (
                <li key={item.sequence}>
                  Classes 0x{item.error_classes.toString(16)} ·{" "}
                  {item.raw_data_hex}
                  {item.overflow
                    ? " · receive loss reported (count unknown)"
                    : ""}{" "}
                  · {item.timestamp_quality}
                </li>
              ))}
            </ul>
          </section>
        )}
        {!!error && (
          <ErrorRecovery
            error={error}
            busy={busy || connectionBusy}
            onDismiss={() => setError(null)}
            onCheck={() => {
              void checkStatus();
            }}
          />
        )}
        {!auth && (
          <section className="pair-panel">
            <h2>Pair this browser</h2>
            <p>
              Start the local service, then run <code>canharbor web open</code>.
              Pairing links expire after 60 seconds.
            </p>
          </section>
        )}
        <section id="devices" className="connection">
          <div className="section-label">01 / CONNECTION</div>
          <p>
            Choose a channel and mode, open it, acquire control, then start.
            Listen only cannot transmit.
          </p>
          <button
            disabled={!auth || busy}
            onClick={() => void act(refreshDevices)}
          >
            Refresh devices
          </button>
          {!devices.length && (
            <p>No channels found. Refresh after connecting an adapter.</p>
          )}
          <div className="connection-grid">
            <label>
              Channel
              <select
                value={channel}
                disabled={!!lease}
                title={
                  lease
                    ? "Close the controlled session before changing channels."
                    : undefined
                }
                onChange={(e) => {
                  setChannel(e.target.value);
                  setSelectedId("");
                  setLease(null);
                  setFdEnabled(false);
                  setNominalBitrate(500000);
                  setDataBitrate(2000000);
                }}
              >
                {devices
                  .flatMap((d) => d.channels)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} · {c.id}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as SessionMode)}
              >
                <option
                  value="listen_only"
                  disabled={selectedChannel?.listen_only === false}
                >
                  Listen only
                </option>
                <option value="active">Active · allows transmission</option>
              </select>
            </label>
            <div className="fixed-setting">
              <label>
                Nominal bitrate
                <input
                  aria-label="Nominal bitrate"
                  aria-invalid={!validNominal}
                  aria-describedby={!validNominal ? "nominal-error" : undefined}
                  type="number"
                  min="1"
                  max="10000000"
                  disabled={selectedDevice?.simulated}
                  value={selectedDevice?.simulated ? 500000 : nominalBitrate}
                  onChange={(e) => setNominalBitrate(Number(e.target.value))}
                />
              </label>
              {!validNominal && (
                <p id="nominal-error">
                  Enter a whole nominal bitrate from 1 to 10000000 bit/s.
                </p>
              )}
              <label>
                <input
                  type="checkbox"
                  checked={fdEnabled}
                  disabled={!selectedChannel?.fd}
                  onChange={(e) => setFdEnabled(e.target.checked)}
                />
                Enable CAN FD
              </label>
              {fdEnabled && (
                <label>
                  FD data bitrate
                  <input
                    aria-label="FD data bitrate"
                    aria-invalid={!validData}
                    aria-describedby={
                      !validData ? "data-bitrate-error" : undefined
                    }
                    type="number"
                    min="1"
                    max="20000000"
                    disabled={selectedDevice?.simulated}
                    value={selectedDevice?.simulated ? 2000000 : dataBitrate}
                    onChange={(e) => setDataBitrate(Number(e.target.value))}
                  />
                </label>
              )}
              {!validData && (
                <p id="data-bitrate-error">
                  Enter a whole data bitrate from 1 to 20000000 bit/s.
                </p>
              )}
              <small>
                {selectedDevice?.simulated
                  ? "Virtual bus: fixed 500 kbit/s / 2 Mbit/s"
                  : "Hardware compatibility has not been verified"}
              </small>
            </div>
            <button
              disabled={
                !auth || busy || !selectedChannel || !!session || !configValid
              }
              className="primary"
              onClick={() =>
                act(async () => {
                  const created = await api(
                    "session",
                    "/sessions",
                    "POST",
                    {
                      channel_id: channel,
                      config: {
                        mode,
                        nominal_bitrate: selectedDevice?.simulated
                          ? 500000
                          : nominalBitrate,
                        ...(fdEnabled
                          ? {
                              fd: {
                                enabled: true,
                                data_bitrate: selectedDevice?.simulated
                                  ? 2000000
                                  : dataBitrate,
                                iso: true,
                              },
                            }
                          : {}),
                      },
                    } satisfies CreateRequest,
                    auth!,
                  );
                  setSelectedId(created.id);
                  setNotice(
                    "Session created. Acquire control, then start the channel.",
                  );
                })
              }
            >
              Open channel
            </button>
          </div>
          <div className="session-bar">
            <label>
              Session
              <select
                aria-label="Session"
                disabled={!!lease}
                title={
                  lease
                    ? "Close the controlled session before selecting another session."
                    : undefined
                }
                value={selectedId}
                onChange={(e) => {
                  setLease(null);
                  setSelectedId(e.target.value);
                  const selected = sessions.find(
                    (item) => item.id === e.target.value,
                  );
                  if (selected) {
                    setChannel(selected.channel_id);
                    setMode(selected.config.mode);
                    setNominalBitrate(selected.config.nominal_bitrate);
                    setFdEnabled(selected.config.data_bitrate !== null);
                    setDataBitrate(selected.config.data_bitrate ?? 2000000);
                  }
                }}
              >
                <option value="">Select a session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.channel_id} · {s.mode}
                  </option>
                ))}
              </select>
            </label>
            <span className="session-state">
              {session?.state ?? "No session"}
            </span>
            <p data-testid="channel-status-certainty">
              {queryStale || !lastQuery
                ? `Current channel state unknown; last reported: ${session?.state ?? "unavailable"}. A disconnected stream does not confirm that the channel stopped.`
                : `Last reported channel state: ${session?.state ?? "unavailable"}.`}
            </p>
            <p>
              Last successful status query:{" "}
              {lastQuery
                ? new Date(lastQuery).toLocaleTimeString()
                : "not yet confirmed"}
              . Last successful control renewal:{" "}
              {lastRenewal
                ? new Date(lastRenewal).toLocaleTimeString()
                : "not yet confirmed"}
              .
            </p>
            {selectedId && streamState === "Disconnected" && (
              <p>
                Event stream disconnected. The channel may remain running while
                control is renewed; query its status before assuming it stopped.
              </p>
            )}
            {renewalUnknown && (
              <p role="alert">
                Control renewal outcome unknown. Renewal is paused; the channel
                may run until its lease expires. Check final status.
              </p>
            )}
            <button
              disabled={connectionBusy || !auth}
              onClick={() => void checkStatus()}
            >
              Check final status
            </button>
            <span className="control-state">
              {controls
                ? "You have control"
                : session?.controller
                  ? "Controlled by another page or CLI"
                  : "Read only"}
            </span>
            <button
              disabled={
                !controls ||
                busy ||
                session?.state !== "configured" ||
                !configValid
              }
              onClick={() =>
                act(async () => {
                  const updated = await api(
                    "session",
                    `/sessions/${selectedId}/config`,
                    "PATCH",
                    {
                      mode,
                      nominal_bitrate: nominalBitrate,
                      ...(fdEnabled
                        ? {
                            fd: {
                              enabled: true,
                              data_bitrate: dataBitrate,
                              iso: true,
                            },
                          }
                        : {}),
                    },
                    auth!,
                    lease!.generation,
                    session!.revision,
                  );
                  setNotice(
                    `Configuration updated · revision ${updated.revision}`,
                  );
                })
              }
            >
              Apply settings to {session?.channel_id ?? "selected session"}
            </button>
            <div className="button-row">
              <button
                disabled={!session || !!session.controller || busy}
                onClick={() =>
                  act(async () => {
                    const requested = performance.now();
                    const owned = await api(
                      "session",
                      `/sessions/${selectedId}/lease`,
                      "POST",
                      {},
                      auth!,
                    );
                    setLease({
                      id: owned.id,
                      generation: owned.generation,
                      renewAt: requested + 5000,
                    });
                  })
                }
              >
                Acquire control
              </button>
              <button
                disabled={!controls || busy}
                onClick={() =>
                  act(() =>
                    control(session?.state === "running" ? "stop" : "start"),
                  )
                }
              >
                {session?.state === "running"
                  ? "Stop channel"
                  : "Start channel"}
              </button>
              <button
                disabled={!controls || busy}
                onClick={() =>
                  act(async () => {
                    await api(
                      "empty",
                      `/sessions/${selectedId}`,
                      "DELETE",
                      {},
                      auth!,
                      lease!.generation,
                    );
                    setLease(null);
                    setSelectedId("");
                  })
                }
              >
                Close
              </button>
            </div>
          </div>
        </section>
        <nav aria-label="Workbench views" className="button-row">
          {[
            ["live", "Live traffic"],
            ["capture", "Recordings"],
            ["offline", "Offline analysis"],
            ["stress", "Stress testing"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={workspace === value}
              onClick={() => setWorkspace(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        <div hidden={workspace !== "capture"}>
          {auth && <CapturePanel auth={auth} session={session} />}
        </div>
        <div hidden={workspace !== "stress"}>
          {auth && <StressPanel auth={auth} devices={devices} />}
        </div>
        <div hidden={workspace !== "offline"}>
          <OfflineCapturePanel />
        </div>
        <div
          className="work-grid"
          hidden={workspace !== "live"}
          style={workspace !== "live" ? { display: "none" } : undefined}
        >
          <section className="monitor">
            <div className="panel-heading">
              <div>
                <div className="section-label">02 / TRAFFIC</div>
                <h2>
                  Frame monitor{" "}
                  <span
                    className={`stream ${streamState === "Live" ? "live" : ""}`}
                  >
                    {streamState}
                  </span>
                </h2>
              </div>
              <div className="button-row">
                <button
                  disabled={!session || streamState === "Live" || busy}
                  onClick={() => setStreamRevision((n) => n + 1)}
                >
                  Reconnect stream
                </button>
                <button disabled={!session} onClick={togglePause}>
                  {paused ? "Resume display" : "Pause display"}
                </button>
                <button onClick={() => setRows([])}>Clear</button>
              </div>
            </div>
            {streamSegments > 0 && (
              <p data-testid="stream-segments">
                Stream reconnected {streamSegments} time(s). Traffic during
                disconnection is unavailable; retained rows span separate stream
                segments.
              </p>
            )}
            <div className="monitor-stats">
              <div>
                <span>RECEIVED</span>
                <strong>{received.toLocaleString()}</strong>
              </div>
              <div>
                <span>STREAM GAPS</span>
                <strong>{gaps.toLocaleString()}</strong>
              </div>
              <div>
                <span>DISPLAY BUFFER</span>
                <strong>
                  {rows.length} <small>/ {MAX_ROWS}</small>
                </strong>
              </div>
              <div>
                <span>DISPLAY</span>
                <strong>{paused ? "Paused" : "Following"}</strong>
              </div>
            </div>
            <div className="button-row">
              <label>
                Filter ID (hex)
                <input
                  value={idFilter}
                  onChange={(e) => setIdFilter(e.target.value)}
                  placeholder="123"
                />
              </label>
              <label>
                Direction
                <select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                >
                  <option value="all">All directions</option>
                  <option value="rx">RX</option>
                  <option value="tx">TX</option>
                </select>
              </label>
            </div>
            <p>
              Filters apply to the last {MAX_ROWS} buffered frames. Pausing
              discards new display updates; reception and recordings continue.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Sequence</th>
                    <th>Elapsed · s</th>
                    <th>Dir</th>
                    <th>ID · hex</th>
                    <th>Type</th>
                    <th>DLC</th>
                    <th>Data · hex</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, index) => (
                    <tr key={`${row.sequence}-${index}`}>
                      <td>{row.sequence}</td>
                      <td
                        title={`${row.timestamp_quality} · reported ${row.device_raw_timestamp_us ?? "unavailable"} µs · epoch ${row.timestamp_epoch}`}
                      >
                        {(
                          Number(
                            (BigInt(row.host_monotonic_ns) -
                              BigInt(
                                elapsedOrigin.current ?? row.host_monotonic_ns,
                              )) /
                              1000000n,
                          ) / 1000
                        ).toFixed(3)}
                      </td>
                      <td>
                        <span className={`direction ${row.direction}`}>
                          {row.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="frame-id">
                        {row.frame.id
                          .toString(16)
                          .toUpperCase()
                          .padStart(row.frame.extended ? 8 : 3, "0")}
                      </td>
                      <td>
                        {row.frame.kind === "fd_data"
                          ? "FD"
                          : row.frame.kind === "classic_remote"
                            ? "RTR"
                            : "CAN"}
                        {row.frame.brs ? " · BRS" : ""}
                        {row.frame.esi ? " · ESI" : ""}
                      </td>
                      <td>{row.frame.dlc}</td>
                      <td>
                        {row.frame.data_hex.match(/.{2}/g)?.join(" ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!!rows.length && !visibleRows.length && (
                <div className="empty">
                  <p>No frames match the current filters.</p>
                  <button
                    onClick={() => {
                      setIdFilter("");
                      setDirectionFilter("all");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              {!rows.length && (
                <div className="empty">
                  <div className="empty-lines">┄ ┄ ┄</div>
                  <h3>Waiting for traffic</h3>
                  <p>
                    Start this channel, then send from the other virtual
                    channel.
                    <br />
                    No background frames are generated.
                  </p>
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>Time relative to first received frame</span>
              <span>
                Last {MAX_ROWS} frames · display is independent of reception
              </span>
            </div>
          </section>
          <section className="transmit">
            <div className="section-label">03 / TRANSMIT</div>
            <h2>Send a frame</h2>
            <p className="muted">
              Single frame submission to the selected channel.
            </p>
            <label>
              Frame type
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as Frame["kind"]);
                  setBrs(false);
                  if (e.target.value === "classic_remote") setData("");
                }}
              >
                <option value="classic_data">Classic CAN</option>
                <option value="fd_data">CAN FD</option>
                <option value="classic_remote">Classic RTR</option>
              </select>
            </label>
            <label>
              Identifier <small>HEXADECIMAL</small>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                spellCheck={false}
              />
            </label>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={extended}
                  onChange={(e) => setExtended(e.target.checked)}
                />
                29-bit ID
              </label>
              <label>
                <input
                  type="checkbox"
                  disabled={kind !== "fd_data"}
                  checked={brs}
                  onChange={(e) => setBrs(e.target.checked)}
                />
                BRS
              </label>
            </div>
            {kind === "classic_remote" ? (
              <label>
                Requested DLC
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={dlc}
                  onChange={(e) => setDlc(Number(e.target.value))}
                />
              </label>
            ) : (
              <label>
                Payload <small>HEX BYTES</small>
                <textarea
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  rows={4}
                  spellCheck={false}
                />
              </label>
            )}
            <p>
              {kind === "classic_remote"
                ? 0
                : Math.floor(data.replace(/\s/g, "").length / 2)}{" "}
              payload bytes
            </p>
            {frameError && <p role="alert">{frameError}</p>}
            {sendBlocked && sendBlocked !== frameError && <p>{sendBlocked}</p>}
            <TransmissionActions
              auth={auth}
              session={selectedId}
              generation={lease?.generation}
              disabled={!!sendBlocked}
              frame={() => validateFrame(kind, id, extended, data, brs, dlc)}
              onError={reportError}
              onNotice={setNotice}
            />
            <TaskPanel
              key={auth?.client_id ?? "unpaired"}
              auth={auth}
              session={selectedId}
              generation={lease?.generation}
              disabled={!!sendBlocked}
              frame={() => validateFrame(kind, id, extended, data, brs, dlc)}
              onError={reportError}
              onControlLost={() => setLease(null)}
            />
            <p className="transmit-note">
              Requires a running, active channel and control. Submission does
              not confirm delivery to a physical device.
            </p>
          </section>
        </div>
        <footer id="about">
          <strong>CANHarbor</strong>
          <span>AGPL-3.0-or-later</span>
          <a
            href="https://github.com/soulteary/canharbor"
            target="_blank"
            rel="noreferrer"
          >
            Source repository ↗
          </a>
          <a href="/api/v1/legal" target="_blank" rel="noreferrer">
            Build & license
          </a>
          <span className="footer-end">
            Development build · Hardware compatibility unverified
          </span>
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
