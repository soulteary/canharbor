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
import { initializeLanguage, useTranslation } from "./i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  sessionConfiguration,
  sameConfiguration,
  describeConfiguration,
  type EditableConfiguration,
} from "./configuration";
import { ErrorRecovery } from "./ErrorRecovery";
import { TransmissionActions } from "./TransmissionActions";
import { OfflineCapturePanel } from "./OfflineCapturePanel";
import { StressPanel } from "./StressPanel";
import { TaskPanel } from "./TaskPanel";
import { CapturePanel } from "./CapturePanel";
import { decode } from "./contract";
import { HardwareGuide } from "./HardwareGuide";
import { aggregateFrames, MAX_AGGREGATES, type Aggregate } from "./monitor";
import type {
  Capabilities,
  SessionMode,
  CreateRequest,
  Subscribe,
} from "./generated/api";
type FrameBusEvent = Extract<BusEvent, { type: "frame_received" }>;
const MAX_ROWS = 500;
// Capture once, before React effects. The code never reaches storage or request URLs.
const pairCode = new URLSearchParams(location.hash.slice(1)).get("pair");
if (pairCode) history.replaceState(null, "", location.pathname);
const views = ["live", "capture", "offline", "stress"];
const initialView = views.includes(location.hash.slice(1))
  ? location.hash.slice(1)
  : null;
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
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useState(
    initialView ??
      (["live", "capture", "offline", "stress"].includes(
        draftString("workspace", "live"),
      )
        ? draftString("workspace", "live")
        : "live"),
  );
  function navigate(view: string) {
    setWorkspace(view);
    if (location.hash !== `#${view}`) history.pushState(null, "", `#${view}`);
  }
  useEffect(() => {
    const restore = () => {
      const view = location.hash.slice(1);
      if (views.includes(view)) setWorkspace(view);
    };
    addEventListener("popstate", restore);
    addEventListener("hashchange", restore);
    return () => {
      removeEventListener("popstate", restore);
      removeEventListener("hashchange", restore);
    };
  }, []);
  const [expandSettings, setExpandSettings] = useState(false);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
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
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState("");
  useEffect(() => {
    let active = true;
    setCapabilities(null);
    setCapabilityError("");
    if (auth && channel) {
      void api(
        "capabilities",
        `/channels/${encodeURIComponent(channel)}/capabilities`,
      )
        .then((value) => {
          if (active) setCapabilities(value);
        })
        .catch(() => {
          if (active)
            setCapabilityError(
              "Device capabilities unavailable. The service will validate settings when you open or apply them.",
            );
        });
    }
    return () => {
      active = false;
    };
  }, [auth, channel]);
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
  const [streamState, setStreamState] = useState<
    "disconnected" | "connecting" | "live"
  >("disconnected");
  const [streamRevision, setStreamRevision] = useState(0);
  const [idFilter, setIdFilter] = useState(draftString("idFilter", ""));
  const [directionFilter, setDirectionFilter] = useState(
    ["all", "rx", "tx"].includes(draftString("directionFilter", "all"))
      ? draftString("directionFilter", "all")
      : "all",
  );
  const [rows, setRows] = useState<FrameBusEvent[]>([]);
  const [received, setReceived] = useState(0);
  const [monitorView, setMonitorView] = useState("frames");
  const [aggregates, setAggregates] = useState<Aggregate[]>([]);
  const aggregateRef = useRef(new Map<string, Aggregate>());
  const displayEvicted = useRef(0);
  const rowCount = useRef(0);
  const groupEvicted = useRef(0);
  const pausedSkipped = useRef(0);
  const [displayCounts, setDisplayCounts] = useState({
    evicted: 0,
    groups: 0,
    paused: 0,
  });
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
  const [configBase, setConfigBase] = useState<{
    id: string;
    value: EditableConfiguration;
  } | null>(null);
  const draftConfig: EditableConfiguration = {
    mode,
    nominalBitrate: selectedDevice?.simulated ? 500000 : nominalBitrate,
    fdEnabled,
    dataBitrate: selectedDevice?.simulated ? 2000000 : dataBitrate,
  };
  const appliedConfig = session ? sessionConfiguration(session) : null;
  const configDirty =
    !!appliedConfig && !sameConfiguration(draftConfig, appliedConfig);
  const configConflict =
    !!appliedConfig &&
    !!configBase &&
    configBase.id === session?.id &&
    !sameConfiguration(configBase.value, appliedConfig);
  function loadConfiguration(value: EditableConfiguration) {
    setMode(value.mode);
    setNominalBitrate(value.nominalBitrate);
    setFdEnabled(value.fdEnabled);
    setDataBitrate(value.dataBitrate);
    if (session) setConfigBase({ id: session.id, value });
  }
  useEffect(() => {
    if (!session || !appliedConfig) {
      setConfigBase(null);
      return;
    }
    if (
      !configBase ||
      configBase.id !== session.id ||
      sameConfiguration(draftConfig, configBase.value)
    ) {
      if (
        !configBase ||
        configBase.id !== session.id ||
        !sameConfiguration(configBase.value, appliedConfig)
      )
        loadConfiguration(appliedConfig);
    }
  }, [
    session?.id,
    session?.config.mode,
    session?.config.nominal_bitrate,
    session?.config.data_bitrate,
  ]);
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
  const rateIssue =
    capabilities &&
    (capabilities.fixed_nominal_bitrates.length > 0 &&
    !capabilities.fixed_nominal_bitrates.includes(draftConfig.nominalBitrate)
      ? "Choose a nominal bitrate advertised by this device."
      : fdEnabled &&
          capabilities.fixed_data_bitrates.length > 0 &&
          !capabilities.fixed_data_bitrates.includes(draftConfig.dataBitrate)
        ? "Choose an FD data bitrate advertised by this device."
        : "");
  const configValid = validNominal && validData && !rateIssue;
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
  const normalizedId = idFilter
    .trim()
    .replace(/^0x/i, "")
    .replace(/^0+(?=.)/, "")
    .toUpperCase();
  const invalidFilter = !!normalizedId && !/^[0-9A-F]{1,8}$/.test(normalizedId);
  const matchesFilter = (row: FrameBusEvent) =>
    !invalidFilter &&
    (!normalizedId ||
      row.frame.id.toString(16).toUpperCase() === normalizedId) &&
    (directionFilter === "all" || row.direction === directionFilter);
  const visibleRows = rows.filter(matchesFilter);
  const visibleAggregates = aggregates.filter((group) =>
    matchesFilter(group.latest),
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
              : streamState !== "live"
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
      aggregateRef.current.clear();
      setAggregates([]);
      displayEvicted.current = 0;
      rowCount.current = 0;
      groupEvicted.current = 0;
      pausedSkipped.current = 0;
      setDisplayCounts({ evicted: 0, groups: 0, paused: 0 });
      setGaps(0n);
      setDiagnostics([]);
      setStreamSegments(0);
    } else if (selectedId && auth) {
      setStreamSegments((n) => n + 1);
    }
    if (!auth || !selectedId) {
      setStreamState("disconnected");
      return;
    }
    let active = true;
    const socket = new WebSocket(
      `${location.origin.replace("http:", "ws:")}/api/v1/sessions/${selectedId}/stream`,
    );
    setStreamState("connecting");
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
        if (message.type === "hello") setStreamState("live");
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
          if (!pausedRef.current) {
            groupEvicted.current += aggregateFrames(
              aggregateRef.current,
              batch,
            );
            displayEvicted.current += Math.max(
              0,
              pending.current.length + batch.length - MAX_ROWS,
            );
            pending.current = [...pending.current, ...batch].slice(-MAX_ROWS);
          } else pausedSkipped.current += batch.length;
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
        setStreamState("disconnected");
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
      setDisplayCounts({
        evicted: displayEvicted.current,
        groups: groupEvicted.current,
        paused: pausedSkipped.current,
      });
      if (pending.current.length) {
        const batch = pending.current;
        pending.current = [];
        displayEvicted.current += Math.max(
          0,
          rowCount.current + batch.length - MAX_ROWS,
        );
        rowCount.current = Math.min(MAX_ROWS, rowCount.current + batch.length);
        setRows((old) => [...old, ...batch].slice(-MAX_ROWS));
        setAggregates([...aggregateRef.current.values()]);
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
    if (!paused) pausedSkipped.current += pending.current.length;
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
          <a
            href="#live"
            className={workspace === "live" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigate("live");
            }}
          >
            Workspace <span>01</span>
          </a>
          <a href="#devices" onClick={() => setWorkspace("live")}>
            Devices <span>{devices.length}</span>
          </a>
          <a
            href="#capture"
            className={workspace === "capture" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigate("capture");
            }}
          >
            {t("recordings")}
          </a>
          <a
            href="#offline"
            className={workspace === "offline" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigate("offline");
            }}
          >
            {t("offline")}
          </a>
          <a
            href="#stress"
            className={workspace === "stress" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigate("stress");
            }}
          >
            {t("stress")}
          </a>
          <a href="#about">{t("about")}</a>
        </nav>
        <LanguageSwitcher auth={auth} />
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
            <h1>{t("workspace")}</h1>
            <p>
              Inspect traffic and send frames through the local Rust service.
            </p>
          </div>
          <span className="simulation">
            <span className="dot" />
            {devices.length === 0
              ? "No device status yet"
              : devices.every((device) => device.simulated)
                ? "Simulation only"
                : "Hardware access enabled · unverified"}
          </span>
        </header>
        {session && (workspace === "offline" || workspace === "stress") && (
          <aside className="active-channel" aria-label="Active channel summary">
            <p>
              {session.channel_id} ·{" "}
              {queryStale ? "status uncertain" : session.state} ·{" "}
              {controls ? "You have control" : "Read only"} · stream{" "}
              {streamState.toLowerCase()}
            </p>
            {controls && (
              <button
                disabled={busy}
                onClick={() =>
                  void act(async () => {
                    await api(
                      "empty",
                      `/sessions/${selectedId}/lease`,
                      "DELETE",
                      {},
                      auth!,
                      lease!.generation,
                    );
                    setLease(null);
                    setNotice("Channel stopped and control released.");
                  })
                }
              >
                Stop and release live channel
              </button>
            )}
          </aside>
        )}
        <nav
          aria-label="Workbench views"
          className="button-row workbench-views"
        >
          {[
            ["live", "Live traffic"],
            ["capture", "Recordings"],
            ["offline", "Offline analysis"],
            ["stress", "Stress testing"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={workspace === value}
              onClick={() => navigate(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        {diagnostics.length > 0 && (
          <section aria-label="Bus diagnostics">
            <h2>Bus diagnostics</h2>
            <p role="status">
              {diagnostics.length} recent bus diagnostic events. Inspect details
              for error classes and timestamp quality.
            </p>
            <details>
              <summary>Diagnostic details</summary>
              <ul>
                {diagnostics.map((item) => (
                  <li key={item.sequence}>
                    {item.overflow
                      ? "Receive overflow — observations may be missing"
                      : item.error_classes & 0x40
                        ? "Bus off — inspect the bus before explicitly restarting"
                        : "Bus diagnostic — inspect adapter details"}{" "}
                    · Classes 0x{item.error_classes.toString(16)} ·{" "}
                    {item.raw_data_hex}
                    {item.overflow
                      ? " · receive loss reported (count unknown)"
                      : ""}{" "}
                    · {item.timestamp_quality}
                  </li>
                ))}
              </ul>
            </details>
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
        <section
          id="devices"
          className={`connection ${session?.state === "running" ? "running" : ""} ${expandSettings || configDirty || configConflict ? "expanded" : ""}`}
          hidden={workspace === "offline" || workspace === "stress"}
        >
          <p className="next-step" role="status">
            <strong>Next step: </strong>
            {!auth
              ? "Pair this browser using canharbor web open."
              : !session
                ? "Choose a channel and mode, then Open channel."
                : !controls
                  ? session.controller
                    ? "This session is controlled elsewhere. Wait for release, or select an available session."
                    : "Acquire control to start or configure this channel."
                  : session.state !== "running"
                    ? "Review settings, then Start channel."
                    : session.mode === "listen_only"
                      ? "Receiving in listen-only mode. Send from the other channel to see traffic."
                      : "Channel running. Use Send once or record traffic."}
          </p>
          <div className="section-label">01 / CONNECTION</div>

          <button
            disabled={!auth || busy}
            onClick={() => void act(refreshDevices)}
          >
            Refresh devices
          </button>
          {!devices.length && (
            <p>
              No registered channels found. Use the adapter guide to discover
              hardware and restart the service with explicit device options.
            </p>
          )}
          {session?.state === "running" && (
            <button
              aria-expanded={expandSettings}
              onClick={() => setExpandSettings(!expandSettings)}
            >
              {expandSettings ? "Hide settings" : "Show channel settings"}
            </button>
          )}
          <HardwareGuide />
          <details className="virtual-guide">
            <summary>First virtual receive / send walkthrough</summary>
            <ol>
              <li>
                Choose virtual:1 and Listen only, then Open channel, Acquire
                control and Start channel.
              </li>
              <li>
                In a terminal run{" "}
                <code>
                  canharbor send --channel virtual:0 --id 123 --data 01020304
                  --active
                </code>
                .
              </li>
              <li>
                The monitor shows ID 123 with bytes 01 02 03 04. For browser
                sending, stop and release, select an active virtual:0 session,
                acquire control and start it.
              </li>
            </ol>
            <p>
              No background frames are generated. Each action is explicit; this
              guide does not start channels or send traffic. With a custom
              runtime directory, pass the same --runtime-dir to the CLI.
            </p>
          </details>
          {session && appliedConfig && (
            <section
              aria-label="Session configuration"
              className="session-configuration"
            >
              <p>
                <strong>Applied configuration:</strong>{" "}
                {describeConfiguration(appliedConfig)}
              </p>
              {configDirty && (
                <p>
                  Unapplied changes. The channel still uses the applied
                  configuration.
                </p>
              )}
              {configConflict && (
                <p role="alert">
                  The server configuration changed while you were editing.
                  Review the current settings before applying your draft.
                </p>
              )}
              <button
                disabled={busy || (!configDirty && !configConflict)}
                onClick={() => loadConfiguration(appliedConfig)}
              >
                Discard draft and load applied settings
              </button>
              {configConflict && (
                <button
                  disabled={busy}
                  onClick={() =>
                    setConfigBase({ id: session.id, value: appliedConfig })
                  }
                >
                  Keep draft against current configuration
                </button>
              )}
            </section>
          )}
          <div className="connection-grid">
            <label>
              Channel
              <select
                value={channel}
                disabled={!!lease}
                title={
                  lease
                    ? "Stop and release control, or close the controlled session, before changing channels."
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
                  list="nominal-rates"
                  min="1"
                  max="10000000"
                  disabled={selectedDevice?.simulated}
                  value={selectedDevice?.simulated ? 500000 : nominalBitrate}
                  onChange={(e) => setNominalBitrate(Number(e.target.value))}
                />
              </label>
              <datalist id="nominal-rates">
                {(capabilities?.fixed_nominal_bitrates.length
                  ? capabilities.fixed_nominal_bitrates
                  : [125000, 250000, 500000, 1000000]
                ).map((rate) => (
                  <option key={rate} value={rate}>
                    {rate / 1000} kbit/s
                  </option>
                ))}
              </datalist>
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
                    list="data-rates"
                    min="1"
                    max="20000000"
                    disabled={selectedDevice?.simulated}
                    value={selectedDevice?.simulated ? 2000000 : dataBitrate}
                    onChange={(e) => setDataBitrate(Number(e.target.value))}
                  />
                </label>
              )}
              <datalist id="data-rates">
                {(capabilities?.fixed_data_bitrates.length
                  ? capabilities.fixed_data_bitrates
                  : [1000000, 2000000, 4000000, 8000000]
                ).map((rate) => (
                  <option key={rate} value={rate}>
                    {rate / 1000000} Mbit/s
                  </option>
                ))}
              </datalist>
              {rateIssue && <p role="alert">{rateIssue}</p>}
              {capabilityError && <p>{capabilityError}</p>}
              {capabilities && (
                <details>
                  <summary>Device timing capabilities</summary>
                  <p>
                    {capabilities.fixed_nominal_bitrates.length
                      ? `Supported nominal rates: ${capabilities.fixed_nominal_bitrates.join(", ")} bit/s.`
                      : "Suggested rates are not a compatibility claim. The device validates achievable timing when settings are applied."}
                  </p>
                  {capabilities.nominal_timing && (
                    <p>
                      Nominal clock: {capabilities.nominal_timing.clock_hz} Hz;
                      prescaler {capabilities.nominal_timing.brp_min}–
                      {capabilities.nominal_timing.brp_max} (step{" "}
                      {capabilities.nominal_timing.brp_inc}); segment 1{" "}
                      {capabilities.nominal_timing.tseg1_min}–
                      {capabilities.nominal_timing.tseg1_max}, segment 2{" "}
                      {capabilities.nominal_timing.tseg2_min}–
                      {capabilities.nominal_timing.tseg2_max}.
                    </p>
                  )}
                  {fdEnabled && (
                    <p>
                      {capabilities.fixed_data_bitrates.length
                        ? `Supported FD data rates: ${capabilities.fixed_data_bitrates.join(", ")} bit/s.`
                        : "FD rates require device timing validation."}
                    </p>
                  )}
                </details>
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
                    ? "Stop and release control, or close the controlled session, before selecting another session."
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
            <details
              className="status-details"
              open={queryStale || renewalUnknown}
            >
              <summary>Connection and control details</summary>
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
              {selectedId && streamState === "disconnected" && (
                <p>
                  Event stream disconnected. The channel may remain running
                  while control is renewed; query its status before assuming it
                  stopped.
                </p>
              )}
              {renewalUnknown && (
                <p role="alert">
                  Control renewal outcome unknown. Renewal is paused; the
                  channel may run until its lease expires. Check final status.
                </p>
              )}
              <button
                disabled={connectionBusy || !auth}
                onClick={() => void checkStatus()}
              >
                Check final status
              </button>
            </details>
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
                configConflict ||
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
                  loadConfiguration(sessionConfiguration(updated));
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
                  void act(async () => {
                    await api(
                      "empty",
                      `/sessions/${selectedId}/lease`,
                      "DELETE",
                      {},
                      auth!,
                      lease!.generation,
                    );
                    setLease(null);
                    setNotice(
                      "Channel stopped and control released. The session remains available until idle cleanup.",
                    );
                  })
                }
              >
                Stop and release control
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
            <small className="stop-impact">
              Stopping or releasing stops acquisition for all observers and ends
              active recordings. Close also removes the session.
            </small>
          </div>
        </section>
        {notice && (
          <p role="status" aria-label="Operation result" className="notice">
            {notice}
          </p>
        )}
        <div hidden={workspace !== "capture"}>
          {auth && (
            <CapturePanel
              auth={auth}
              session={session}
              onInspect={(file) => {
                setRecordingFile(file);
                navigate("offline");
              }}
            />
          )}
        </div>
        <div hidden={workspace !== "stress"}>
          {auth && <StressPanel auth={auth} devices={devices} />}
        </div>
        <div hidden={workspace !== "offline"}>
          <OfflineCapturePanel recordingFile={recordingFile} />
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
                    className={`stream ${streamState === "live" ? "live" : ""}`}
                  >
                    {
                      {
                        disconnected: "Disconnected",
                        connecting: "Connecting",
                        live: "Live",
                      }[streamState]
                    }
                  </span>
                </h2>
              </div>
              <div className="button-row">
                <button
                  disabled={!session || streamState === "live" || busy}
                  onClick={() => setStreamRevision((n) => n + 1)}
                >
                  Reconnect stream
                </button>
                <button disabled={!session} onClick={togglePause}>
                  {paused ? "Resume display" : "Pause display"}
                </button>
                <button
                  onClick={() => {
                    pending.current = [];
                    rowCount.current = 0;
                    setRows([]);
                    aggregateRef.current.clear();
                    setAggregates([]);
                  }}
                >
                  Clear
                </button>
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
            <div className="monitor-filters">
              <label>
                Monitor view
                <select
                  aria-label="Monitor view"
                  value={monitorView}
                  onChange={(e) => setMonitorView(e.target.value)}
                >
                  <option value="frames">Recent frames</option>
                  <option value="ids">By ID · retained counts</option>
                </select>
              </label>
              <label>
                Filter ID (hex)
                <input
                  value={idFilter}
                  onChange={(e) => setIdFilter(e.target.value)}
                  placeholder="123"
                  aria-invalid={invalidFilter}
                  aria-describedby="id-filter-help"
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
            <p id="id-filter-help">
              Exact ID match, with optional 0x prefix. Recent frames retain{" "}
              {MAX_ROWS} frames; By ID retains up to {MAX_AGGREGATES} groups
              across the observed stream. Pausing discards display updates;
              reception and recordings continue.
            </p>
            {invalidFilter && (
              <p role="alert">
                Enter up to eight hexadecimal digits for an exact ID match.
              </p>
            )}
            <p className="display-loss">
              Display evicted: {displayCounts.evicted.toLocaleString()} frames ·
              paused updates skipped: {displayCounts.paused.toLocaleString()} ·
              ID groups evicted: {displayCounts.groups.toLocaleString()}. These
              are separate from stream gaps.
            </p>
            {monitorView === "ids" && (
              <div className="table-scroll aggregate-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID · hex</th>
                      <th>Width</th>
                      <th>Direction</th>
                      <th>Type</th>
                      <th>Observed count</th>
                      <th>Latest data · hex</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAggregates.map((group) => (
                      <tr key={group.key}>
                        <td>
                          {group.latest.frame.id.toString(16).toUpperCase()}
                        </td>
                        <td>
                          {group.latest.frame.extended ? "29-bit" : "11-bit"}
                        </td>
                        <td>{group.latest.direction.toUpperCase()}</td>
                        <td>{group.latest.frame.kind}</td>
                        <td>{group.count.toLocaleString()}</td>
                        <td>
                          {group.latest.frame.data_hex
                            .match(/.{2}/g)
                            ?.join(" ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visibleAggregates.length && (
                  <p>
                    No ID groups match. Counts start at subscription or Clear,
                    exclude paused updates, and reset when a group is evicted.
                  </p>
                )}
              </div>
            )}
            <div className="table-scroll" hidden={monitorView !== "frames"}>
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
              channel={session?.channel_id}
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
void initializeLanguage().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
