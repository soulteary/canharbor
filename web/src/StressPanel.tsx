// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { ErrorRecovery } from "./ErrorRecovery";
import { api, ApiFailure, type Auth, type Device } from "./api";
import type {
  StressReport,
  StressValidation,
  StressArtifacts,
  StressPlan,
  StressRunSummary,
  StressFlow,
} from "./generated/api";
const defaultCriteria = {
  min_submitted_ppm: 1000000,
  max_scheduler_skipped: 0,
  max_missing_expected_ppm: 0,
  max_missing_submitted_ppm: 0,
  max_duplicates: 0,
  max_reordered: 0,
  max_payload_errors: 0,
  max_out_of_range: 0,
  max_dispatch_lateness_ns: null as number | null,
};
const terminal = (s: string) =>
  ["completed", "failed", "aborted", "interrupted"].includes(s);
export function StressPanel({
  auth,
  devices,
}: {
  auth: Auth;
  devices: Device[];
}) {
  const [trackingMode, setTrackingMode] = useState("exact");
  const [trackingCapacity, setTrackingCapacity] = useState(4096);
  const [queueEnabled, setQueueEnabled] = useState(false);
  const [queueEvery, setQueueEvery] = useState(100);
  const [flowsText, setFlowsText] = useState("[]");
  const [timingEnabled, setTimingEnabled] = useState(false);
  const [timingEvery, setTimingEvery] = useState(100);
  const [timingPending, setTimingPending] = useState(4096);
  const [busLabel, setBusLabel] = useState("");
  const [wiring, setWiring] = useState("");
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [fd, setFd] = useState(false);
  const [pattern, setPattern] = useState(false);
  const [checkpointId, setCheckpointId] = useState("124");
  const [patternWindow, setPatternWindow] = useState(256);
  const [dataBitrate, setDataBitrate] = useState(2000000);
  const [lengths, setLengths] = useState("32,48,64");
  const [brsMode, setBrsMode] = useState("mixed");
  const [rttEnabled, setRttEnabled] = useState(false);
  const [responseId, setResponseId] = useState("124");
  const [rttTimeout, setRttTimeout] = useState(100);
  const [sender, setSender] = useState("virtual:0");
  const [receivers, setReceivers] = useState(["virtual:1"]);
  const [kind, setKind] = useState("fixed");
  const [shapeKind, setShapeKind] = useState("uniform");
  const [burstFrames, setBurstFrames] = useState(8);
  const [intervalSeed, setIntervalSeed] = useState(42);
  const [jitterPpm, setJitterPpm] = useState(500000);
  const [exploreSeconds, setExploreSeconds] = useState(5);
  const [measureSeconds, setMeasureSeconds] = useState(30);
  const [minObservedPpm, setMinObservedPpm] = useState(950000);
  const [fps, setFps] = useState(100);
  const [count, setCount] = useState(100);
  const [rates, setRates] = useState("100,500,1000");
  const [seconds, setSeconds] = useState(60);
  const [warmup, setWarmup] = useState(2);
  const [bitrate, setBitrate] = useState(500000);
  const [canId, setCanId] = useState("123");
  const [ack, setAck] = useState(true);
  const [disk, setDisk] = useState(256);
  const [rssLimit, setRssLimit] = useState(0);
  const [rssWarmup, setRssWarmup] = useState(60);
  const [sample, setSample] = useState(0);
  const [tag, setTag] = useState(
    () => crypto.getRandomValues(new Uint32Array(1))[0],
  );
  const [active, setActive] = useState(false);
  const [validation, setValidation] = useState<StressValidation | null>(null);
  const [runs, setRuns] = useState<StressRunSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<StressReport | null>(null);
  const [artifacts, setArtifacts] = useState<StressArtifacts | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [scope, setScope] = useState("");
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  function applyTemplate(template: "check" | "staircase" | "soak") {
    setKind(template === "check" ? "fixed" : template);
    setFps(100);
    setCount(100);
    setRates("100,500,1000");
    setSeconds(60);
    setWarmup(2);
    setBitrate(500000);
    setCanId("123");
    setFd(false);
    setPattern(false);
    setRttEnabled(false);
    setTrackingMode("exact");
    setQueueEnabled(false);
    setTimingEnabled(false);
    setFlowsText("[]");
    setCriteria(defaultCriteria);
    setShapeKind("uniform");
    setDisk(256);
    setRssLimit(0);
    setSample(0);
    setAck(true);
    setActive(false);
    setValidation(null);
  }
  const declaredAliases = [sender, ...receivers]
    .filter((channel) => aliases[channel]?.trim())
    .map((channel) => ({ channel, alias: aliases[channel].trim() }));
  let flows: StressFlow[] = [];
  let flowError = "";
  try {
    const parsed: unknown = JSON.parse(flowsText);
    if (
      !Array.isArray(parsed) ||
      parsed.some((v) => !v || typeof v !== "object" || Array.isArray(v))
    )
      throw new Error("Additional flows must be a JSON array of objects");
    flows = parsed as StressFlow[];
  } catch (e) {
    flowError = String(e);
  }
  const patternActive =
    pattern || flows.some((f) => f.traffic?.format === "classic_pattern_v1");
  const plan: StressPlan = {
    ...(trackingMode === "sliding"
      ? { tracking: { format: "sliding" as const, capacity: trackingCapacity } }
      : {}),
    ...(queueEnabled ? { queues: { sample_every: queueEvery } } : {}),
    ...(kind === "adaptive"
      ? {
          adaptive: {
            rates: rates.split(",").map(Number),
            exploration_seconds: exploreSeconds,
            measurement_seconds: measureSeconds,
            min_observed_ppm: minObservedPpm,
          },
        }
      : {}),
    ...(shapeKind === "burst"
      ? { shape: { format: "burst" as const, frames: burstFrames } }
      : shapeKind === "seeded"
        ? {
            shape: {
              format: "seeded_intervals" as const,
              seed: intervalSeed,
              jitter_ppm: jitterPpm,
            },
          }
        : {}),
    ...(flows.length ? { flows } : {}),
    ...(timingEnabled
      ? { timing: { sample_every: timingEvery, max_pending: timingPending } }
      : {}),
    ...(busLabel || wiring || declaredAliases.length
      ? { topology: { bus: busLabel, wiring, aliases: declaredAliases } }
      : {}),
    criteria,
    ...(pattern
      ? {
          traffic: {
            format: "classic_pattern_v1" as const,
            checkpoint_can_id: /^[0-9a-f]+$/i.test(checkpointId)
              ? parseInt(checkpointId, 16)
              : -1,
            seed: tag,
            stream: 1,
            max_pending: patternWindow,
          },
        }
      : {}),
    ...(fd
      ? {
          traffic: {
            format: "fd_v1" as const,
            data_bitrate: dataBitrate,
            stream: 1,
            epoch: tag || 1,
            seed: tag,
            variants: lengths.split(",").map((n, i) => ({
              length: Number(n),
              brs: brsMode === "on" || (brsMode === "mixed" && i % 2 === 1),
            })),
          },
        }
      : {}),
    ...(fd && rttEnabled
      ? {
          rtt: {
            role: "loopback" as const,
            response_can_id: /^[0-9a-f]+$/i.test(responseId)
              ? parseInt(responseId, 16)
              : -1,
            timeout_ms: rttTimeout,
            max_inflight: 128,
          },
        }
      : {}),
    sender,
    receivers,
    can_id: /^[0-9a-f]+$/i.test(canId) ? parseInt(canId, 16) : -1,
    extended: false,
    run_tag: tag,
    bitrate,
    receivers_active: ack,
    drain_ms: 200,
    count: kind === "fixed" ? count : 0,
    fps: kind === "fixed" ? fps : 0,
    stages:
      kind === "fixed" || kind === "adaptive"
        ? []
        : (kind === "soak" ? [fps] : rates.split(",").map(Number)).map(
            (rate, index) => ({
              name: `${kind}-${index + 1}`,
              fps: rate,
              duration_seconds: seconds,
              warmup_seconds: warmup,
            }),
          ),
    ...(rssLimit > 0
      ? {
          stability: {
            max_rss_growth_bytes: rssLimit * 1048576,
            warmup_seconds: rssWarmup,
          },
        }
      : {}),
    evidence: {
      max_bytes: disk * 1024 * 1024,
      segment_bytes: 4 * 1024 * 1024,
      sample_every: patternActive ? 1 : sample,
    },
  };
  const signature = JSON.stringify(plan);
  useEffect(() => {
    setValidation(null);
  }, [signature, flowsText]);
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      try {
        const version = await api("version", "/version");
        if (!live) return;
        const key = `canharbor:stress:${version.server_instance_id}:${auth.client_id}`;
        setScope(key);
        try {
          setPending(sessionStorage.getItem(key));
        } catch {
          /* in-memory only */
        }
      } catch (e) {
        if (live) setError(e);
      }
    })();
    const poll = async () => {
      try {
        const list = await api("stress_runs", "/stress/runs");
        if (!live) return;
        setRuns(list.runs);
        const id =
          selectedRef.current ||
          list.runs.find((r) => !terminal(r.state))?.id ||
          list.runs.at(-1)?.id;
        if (id) {
          if (!selectedRef.current) {
            selectedRef.current = id;
            setSelected(id);
          }
          const value = await api(
            "stress_report",
            `/stress/runs/${encodeURIComponent(id)}`,
          );
          if (!live || selectedRef.current !== id) return;
          setReport(value);
        }
      } catch (e) {
        if (live) setError(e);
      }
      if (live) timer = setTimeout(poll, 500);
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [auth]);
  useEffect(() => {
    setArtifacts(null);
    if (!report || !terminal(report.state)) return;
    let live = true;
    void api("stress_artifacts", `/stress/runs/${report.id}/artifacts`)
      .then((value) => {
        if (live) setArtifacts(value);
      })
      .catch((e) => {
        if (live) setError(e);
      });
    return () => {
      live = false;
    };
  }, [report?.id, report?.state]);
  function addReverse() {
    if (plan.adaptive || flowError || !receivers.length || flows.length >= 7)
      return;
    const used = new Set([
      plan.can_id,
      ...(plan.traffic?.format === "classic_pattern_v1"
        ? [plan.traffic.checkpoint_can_id]
        : []),
      ...(plan.rtt ? [plan.rtt.response_can_id] : []),
      ...flows.flatMap((f) => [
        f.can_id,
        ...(f.traffic?.format === "classic_pattern_v1"
          ? [f.traffic.checkpoint_can_id]
          : []),
        ...(f.rtt ? [f.rtt.response_can_id] : []),
      ]),
    ]);
    let id = (plan.can_id + 1) & 0x7ff;
    while (used.has(id)) id = (id + 1) & 0x7ff;
    let runTag: number;
    do {
      runTag = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (runTag === tag || flows.some((f) => f.run_tag === runTag));
    const usedNames = new Set(flows.map((f) => f.name));
    let index = flows.length + 1;
    while (usedNames.has(`reverse-${index}`)) index++;
    let traffic = plan.traffic;
    if (traffic?.format === "classic_pattern_v1") {
      let checkpoint = (id + 1) & 0x7ff;
      while (used.has(checkpoint) || checkpoint === id)
        checkpoint = (checkpoint + 1) & 0x7ff;
      traffic = { ...traffic, checkpoint_can_id: checkpoint };
    }
    const flow: StressFlow = {
      name: `reverse-${index}`,
      sender: receivers[0],
      receivers: [sender],
      can_id: id,
      extended: false,
      run_tag: runTag,
      count: plan.count,
      fps: plan.fps,
      stages: plan.stages,
      ...(plan.tracking ? { tracking: plan.tracking } : {}),
      ...(plan.queues ? { queues: plan.queues } : {}),
      ...(plan.shape ? { shape: plan.shape } : {}),
      criteria: plan.criteria,
      ...(traffic ? { traffic } : {}),
      ...(plan.timing ? { timing: plan.timing } : {}),
    };
    setFlowsText(JSON.stringify([...flows, flow], null, 2));
  }
  async function stopFlow(name: string) {
    if (!report) return;
    try {
      setReport(
        await api(
          "stress_report",
          `/stress/runs/${report.id}/flows/${encodeURIComponent(name)}/stop`,
          "POST",
          {},
          auth,
        ),
      );
    } catch (e) {
      setError(e);
    }
  }
  async function check() {
    if (flowError) {
      setError(flowError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      setValidation(
        await api("stress_validation", "/stress/validate", "POST", plan, auth),
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function clearPending() {
    setPending(null);
    try {
      sessionStorage.removeItem(scope);
    } catch {
      /* no credentials saved */
    }
  }
  async function start() {
    if (!validation || !active || pending || !scope) return;
    setBusy(true);
    setError("");
    const request = crypto.randomUUID();
    setPending(request);
    try {
      sessionStorage.setItem(scope, request);
    } catch {
      /* recovery remains in memory */
    }
    try {
      const value = await api(
        "stress_report",
        "/stress/runs",
        "POST",
        {
          client_request_id: request,
          plan_hash: validation.plan_hash,
          active: true,
          plan: validation.plan,
        },
        auth,
      );
      setSelected(value.id);
      selectedRef.current = value.id;
      setReport(value);
      clearPending();
      setActive(false);
      setTag(crypto.getRandomValues(new Uint32Array(1))[0]);
    } catch (e) {
      if (e instanceof ApiFailure && !e.unknown) {
        clearPending();
        setError(e);
      } else {
        setError(
          `${String(e)}. Start result may be unknown; recover the saved request. Do not start another run.`,
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function recover() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      const value = await api(
        "stress_report",
        `/stress/requests/${encodeURIComponent(pending)}`,
      );
      setSelected(value.id);
      selectedRef.current = value.id;
      setReport(value);
      clearPending();
      setActive(false);
      setTag(crypto.getRandomValues(new Uint32Array(1))[0]);
    } catch (e) {
      setError(
        `${String(e)}. A missing result does not prove the run never started. Recovery does not transmit.`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function refreshStatus() {
    setBusy(true);
    try {
      const list = await api("stress_runs", "/stress/runs");
      setRuns(list.runs);
      if (selectedRef.current)
        setReport(
          await api(
            "stress_report",
            `/stress/runs/${encodeURIComponent(selectedRef.current)}`,
          ),
        );
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function stop() {
    if (!report) return;
    setBusy(true);
    setError("");
    try {
      setReport(
        await api(
          "stress_report",
          `/stress/runs/${report.id}/stop`,
          "POST",
          {},
          auth,
        ),
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const channels = devices.flatMap((d) =>
    d.channels.map((c) => ({ ...c, simulated: d.simulated })),
  );
  const history = report?.history ?? [];
  const series = history.slice(1).map((point, i) => {
    const before = history[i];
    const seconds = (point.elapsed_ms - before.elapsed_ms) / 1000;
    return {
      t: point.elapsed_ms / 1000,
      fps: seconds > 0 ? (point.submitted - before.submitted) / seconds : 0,
      target:
        report?.adaptive?.reserved_peak_fps ??
        report?.group?.budget.peak_transmit_fps ??
        point.target_fps,
    };
  });
  const maxY = Math.max(1, ...series.flatMap((p) => [p.fps, p.target]));
  const tMin = series[0]?.t ?? 0;
  const tMax = Math.max(tMin + 1, series.at(-1)?.t ?? 1);
  const points = (key: "fps" | "target") =>
    series
      .map(
        (p) =>
          `${50 + ((p.t - tMin) / (tMax - tMin)) * 690},${180 - (p[key] / maxY) * 150}`,
      )
      .join(" ");
  return (
    <section id="stress" className="stress-panel" aria-label="Stress testing">
      <div className="panel-heading">
        <div>
          <div className="section-label">STRESS / CLASSIC CAN</div>
          <h2>Stress testing</h2>
          <p>
            Service-owned execution · 10 ms scheduling quantum · peer RX
            verification
          </p>
        </div>
      </div>
      <p>
        Use an isolated test bus. Normal receivers participate in ACK;
        listen-only receivers do not. Hardware compatibility remains unverified.
      </p>
      <fieldset disabled={busy}>
        <legend>Quick setup</legend>
        <p>
          Templates replace the current plan settings. Review channels and
          validate before authorizing transmission.
        </p>
        <button onClick={() => applyTemplate("check")}>
          Short receive check
        </button>
        <button onClick={() => applyTemplate("staircase")}>
          Rate staircase
        </button>
        <button onClick={() => applyTemplate("soak")}>One-minute soak</button>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Test plan</legend>
        <div className="stress-grid">
          <label>
            Stress sender
            <select
              aria-label="Stress sender"
              value={sender}
              onChange={(e) => {
                setSender(e.target.value);
                setReceivers((current) =>
                  current.filter((id) => id !== e.target.value),
                );
              }}
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} · {c.simulated ? "simulated" : "hardware"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Workload
            <select
              aria-label="Stress workload"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="fixed">Fixed frame count</option>
              <option value="staircase">Staircase</option>
              <option value="soak">Long-duration soak</option>
              <option value="adaptive">Predeclared adaptive exploration</option>
            </select>
          </label>
          {kind !== "adaptive" && (
            <label>
              Target frames/s
              <input
                aria-label="Stress target fps"
                type="number"
                min="1"
                max="20000"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
              />
            </label>
          )}
          {kind === "adaptive" ? (
            <>
              <label>
                Candidate rates (increasing physical frames/s)
                <input
                  aria-label="Stress adaptive rates"
                  value={rates}
                  onChange={(e) => setRates(e.target.value)}
                />
              </label>
              <label>
                Exploration seconds per candidate
                <input
                  aria-label="Stress adaptive explore seconds"
                  type="number"
                  min="1"
                  value={exploreSeconds}
                  onChange={(e) => setExploreSeconds(Number(e.target.value))}
                />
              </label>
              <label>
                Fixed measurement seconds
                <input
                  aria-label="Stress adaptive measure seconds"
                  type="number"
                  min="1"
                  value={measureSeconds}
                  onChange={(e) => setMeasureSeconds(Number(e.target.value))}
                />
              </label>
              <label>
                Minimum observed host rate (ppm)
                <input
                  aria-label="Stress adaptive observed ppm"
                  type="number"
                  min="1"
                  max="1000000"
                  value={minObservedPpm}
                  onChange={(e) => setMinObservedPpm(Number(e.target.value))}
                />
              </label>
              <p>
                All candidates and criteria are frozen before authorization.
                Exploration stops at the first unqualified candidate and selects
                the previous qualified rate. Fixed measurement never reduces its
                selected rate. Single scheduled stream; no RTT or additional
                flows.
              </p>
            </>
          ) : kind === "fixed" ? (
            <label>
              Frame count
              <input
                aria-label="Stress frame count"
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
          ) : (
            <>
              {kind === "staircase" && (
                <label>
                  Stage rates (frames/s)
                  <input
                    aria-label="Stress stage rates"
                    value={rates}
                    onChange={(e) => setRates(e.target.value)}
                  />
                </label>
              )}
              <label>
                Seconds per measurement stage
                <input
                  aria-label="Stress stage seconds"
                  type="number"
                  min="1"
                  value={seconds}
                  onChange={(e) => setSeconds(Number(e.target.value))}
                />
              </label>
              <label>
                Warmup seconds per stage
                <input
                  aria-label="Stress warmup seconds"
                  type="number"
                  min="0"
                  value={warmup}
                  onChange={(e) => setWarmup(Number(e.target.value))}
                />
              </label>
            </>
          )}
          <label>
            Load shape
            <select
              aria-label="Stress load shape"
              value={shapeKind}
              onChange={(e) => setShapeKind(e.target.value)}
            >
              <option value="uniform">Uniform</option>
              <option value="burst">Bounded burst</option>
              <option value="seeded">Fixed-seed intervals</option>
            </select>
          </label>
          {shapeKind === "burst" && (
            <label>
              Maximum physical frames per burst
              <input
                aria-label="Stress burst frames"
                type="number"
                min="1"
                max="200"
                value={burstFrames}
                onChange={(e) => setBurstFrames(Number(e.target.value))}
              />
            </label>
          )}
          {shapeKind === "seeded" && (
            <>
              <label>
                Interval seed
                <input
                  aria-label="Stress interval seed"
                  type="number"
                  min="0"
                  max="4294967295"
                  value={intervalSeed}
                  onChange={(e) => setIntervalSeed(Number(e.target.value))}
                />
              </label>
              <label>
                Maximum slot jitter (ppm)
                <input
                  aria-label="Stress interval jitter"
                  type="number"
                  min="1"
                  max="500000"
                  value={jitterPpm}
                  onChange={(e) => setJitterPpm(Number(e.target.value))}
                />
              </label>
            </>
          )}
          {shapeKind !== "uniform" && (
            <p>
              Shapes use a 10 ms host scheduler quantum. Burst spacing must be
              at least one quantum; reserve includes the physical peak. Seeded
              deadlines are reproducible, not physical wire timing. Control
              frames count toward every rate and burst.
            </p>
          )}
          <label>
            Frame protocol
            <select
              aria-label="Stress protocol"
              value={pattern ? "pattern" : fd ? "fd" : "classic"}
              onChange={(e) => {
                setFd(e.target.value === "fd");
                setPattern(e.target.value === "pattern");
              }}
            >
              <option value="classic">Classic sequence</option>
              <option value="pattern">Classic pattern-v1 + checkpoint</option>
              <option value="fd">CAN FD CRC / mixed lengths</option>
            </select>
          </label>
          {pattern && (
            <>
              <label>
                Checkpoint CAN ID (hex)
                <input
                  aria-label="Stress checkpoint CAN ID"
                  value={checkpointId}
                  onChange={(e) => setCheckpointId(e.target.value)}
                />
              </label>
              <label>
                Correlation window
                <input
                  aria-label="Stress pattern window"
                  type="number"
                  min="1"
                  max="4096"
                  value={patternWindow}
                  onChange={(e) => setPatternWindow(Number(e.target.value))}
                />
              </label>
              <p>
                Count and rate include both checkpoint and data frames; use even
                numbers. Full raw evidence is required. Missing checkpoints,
                retired data and ambiguous association cannot pass. No
                application CRC or authentication is claimed.
              </p>
            </>
          )}
          {fd && (
            <>
              <label>
                FD data bitrate
                <input
                  aria-label="Stress data bitrate"
                  type="number"
                  value={dataBitrate}
                  onChange={(e) => setDataBitrate(Number(e.target.value))}
                />
              </label>
              <label>
                FD lengths (bytes, comma separated)
                <input
                  aria-label="Stress FD lengths"
                  value={lengths}
                  onChange={(e) => setLengths(e.target.value)}
                />
              </label>
              <label>
                FD bitrate switching
                <select
                  aria-label="Stress BRS"
                  value={brsMode}
                  onChange={(e) => setBrsMode(e.target.value)}
                >
                  <option value="mixed">Alternate off/on</option>
                  <option value="on">All on</option>
                  <option value="off">All off</option>
                </select>
              </label>
              <label>
                Enable explicit RTT responder
                <input
                  aria-label="Stress RTT"
                  type="checkbox"
                  checked={rttEnabled}
                  onChange={(e) => setRttEnabled(e.target.checked)}
                />
              </label>
              {rttEnabled && (
                <>
                  <label>
                    RTT response ID (hex)
                    <input
                      aria-label="Stress response ID"
                      value={responseId}
                      onChange={(e) => setResponseId(e.target.value)}
                    />
                  </label>
                  <label>
                    RTT timeout (ms)
                    <input
                      aria-label="Stress RTT timeout"
                      type="number"
                      value={rttTimeout}
                      onChange={(e) => setRttTimeout(Number(e.target.value))}
                    />
                  </label>
                </>
              )}
            </>
          )}
          <label>
            Nominal bitrate (bit/s)
            <input
              aria-label="Stress bitrate"
              type="number"
              value={bitrate}
              onChange={(e) => setBitrate(Number(e.target.value))}
            />
          </label>
          <label>
            Standard CAN ID (hex)
            <input
              aria-label="Stress CAN ID"
              value={canId}
              onChange={(e) => setCanId(e.target.value)}
            />
          </label>
          <label>
            Evidence reservation (MiB)
            <select
              aria-label="Stress evidence budget"
              value={disk}
              onChange={(e) => setDisk(Number(e.target.value))}
            >
              {[64, 256, 512, 1024, 2048].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Sample every N matching frames (0 = off)
            <input
              aria-label="Stress sample interval"
              type="number"
              min="0"
              value={patternActive ? 1 : sample}
              disabled={patternActive}
              onChange={(e) => setSample(Number(e.target.value))}
            />
          </label>
          <label>
            Maximum process RSS growth (MiB, 0 = off)
            <input
              aria-label="Stress RSS growth limit"
              type="number"
              min="0"
              value={rssLimit}
              onChange={(e) => setRssLimit(Number(e.target.value))}
            />
          </label>
          <label>
            RSS baseline warmup (seconds)
            <input
              aria-label="Stress RSS warmup"
              type="number"
              min="0"
              value={rssWarmup}
              onChange={(e) => setRssWarmup(Number(e.target.value))}
            />
          </label>
        </div>
        <details>
          <summary>Advanced stress settings</summary>
          <p>
            These values remain part of the plan when this section is closed.
          </p>
          <fieldset>
            <legend>Acceptance criteria (frozen when validated)</legend>
            <p>
              Ratios use integer ppm: 1000000 = 100%. Submission ratio applies
              to every stage, including warmup. Unknown submissions, incomplete
              evidence and interrupted execution cannot pass.
            </p>
            <div className="stress-grid">
              {(
                [
                  [
                    "min_submitted_ppm",
                    "Minimum scheduled submission ratio (ppm)",
                  ],
                  ["max_scheduler_skipped", "Maximum scheduler skipped"],
                  [
                    "max_missing_expected_ppm",
                    "Maximum planned RX missing (ppm)",
                  ],
                  [
                    "max_missing_submitted_ppm",
                    "Maximum submitted RX missing (ppm)",
                  ],
                  ["max_duplicates", "Maximum duplicates per receiver"],
                  ["max_reordered", "Maximum reordered per receiver"],
                  ["max_payload_errors", "Maximum payload errors per receiver"],
                  ["max_out_of_range", "Maximum out of range per receiver"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    aria-label={`Stress criterion ${key}`}
                    type="number"
                    min={key === "min_submitted_ppm" ? 1 : 0}
                    max={
                      key === "min_submitted_ppm"
                        ? 1000000
                        : key.endsWith("ppm")
                          ? 999999
                          : 4294967295
                    }
                    step="1"
                    value={criteria[key]}
                    onChange={(e) =>
                      setCriteria({
                        ...criteria,
                        [key]: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
              <label>
                Maximum dispatch lateness (ms, blank = no limit)
                <input
                  aria-label="Stress criterion dispatch lateness"
                  type="number"
                  min="0"
                  max="259200000"
                  step="1"
                  value={
                    criteria.max_dispatch_lateness_ns == null
                      ? ""
                      : criteria.max_dispatch_lateness_ns / 1e6
                  }
                  onChange={(e) =>
                    setCriteria({
                      ...criteria,
                      max_dispatch_lateness_ns:
                        e.target.value === ""
                          ? null
                          : Number(e.target.value) * 1e6,
                    })
                  }
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Tracking and receive queues</legend>
            <label>
              Receive tracking{" "}
              <select
                aria-label="Stress tracking mode"
                value={trackingMode}
                onChange={(e) => setTrackingMode(e.target.value)}
              >
                <option value="exact">Exact bitmap (finite plan)</option>
                <option value="sliding">Sliding window</option>
              </select>
            </label>
            {trackingMode === "sliding" && (
              <label>
                Window slots{" "}
                <input
                  aria-label="Stress tracking capacity"
                  type="number"
                  min="64"
                  max="1048576"
                  value={trackingCapacity}
                  onChange={(e) => setTrackingCapacity(Number(e.target.value))}
                />
              </label>
            )}
            <p>
              Window slots must be a power of two. Evicted history is frozen;
              late arrivals cannot repair loss and prevent a pass. Transmit
              outcomes remain exact within the total memory limit.
            </p>
            <label>
              <input
                aria-label="Enable stress queue sampling"
                type="checkbox"
                checked={queueEnabled}
                onChange={(e) => setQueueEnabled(e.target.checked)}
              />{" "}
              Sample receive queue depth and residence
            </label>
            {queueEnabled && (
              <label>
                Every eligible RX{" "}
                <input
                  aria-label="Stress queue sample interval"
                  type="number"
                  min="1"
                  value={queueEvery}
                  onChange={(e) => setQueueEvery(Number(e.target.value))}
                />
              </label>
            )}
            <p>
              Observed depth is a sampled lower bound including other backlog.
              Residence measures backend receipt to host verification; native
              worker residence is in host timing.
            </p>
          </fieldset>
          <fieldset>
            <legend>Host timing and source evidence</legend>
            <label className="stress-check">
              <input
                aria-label="Enable stress host timing"
                type="checkbox"
                checked={timingEnabled}
                onChange={(e) => setTimingEnabled(e.target.checked)}
              />
              Record sampled host timing (additional evidence budget)
            </label>
            {timingEnabled && (
              <div className="stress-grid">
                <label>
                  Measure every Nth sequence
                  <input
                    aria-label="Stress timing sample interval"
                    type="number"
                    min="1"
                    value={timingEvery}
                    onChange={(e) => setTimingEvery(Number(e.target.value))}
                  />
                </label>
                <label>
                  Maximum pending timing records
                  <input
                    aria-label="Stress timing window"
                    type="number"
                    min="1"
                    max="4096"
                    value={timingPending}
                    onChange={(e) => setTimingPending(Number(e.target.value))}
                  />
                </label>
              </div>
            )}
            <p>
              Host RX minus backend call completion may be negative. Missing
              matches and unsupported worker queues stay explicit. These are
              host observations, without wire or cross-host latency claims.
            </p>
            <div className="stress-grid">
              <label>
                Declared bus label
                <input
                  aria-label="Stress declared bus"
                  maxLength={128}
                  value={busLabel}
                  onChange={(e) => setBusLabel(e.target.value)}
                />
              </label>
              <label>
                Declared wiring and termination
                <input
                  aria-label="Stress declared wiring"
                  maxLength={1024}
                  value={wiring}
                  onChange={(e) => setWiring(e.target.value)}
                />
              </label>
              {[sender, ...receivers].map((channel) => (
                <label key={channel}>
                  Role alias · {channel}
                  <input
                    aria-label={`Stress role alias ${channel}`}
                    maxLength={64}
                    value={aliases[channel] ?? ""}
                    onChange={(e) =>
                      setAliases({ ...aliases, [channel]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <p>
              Declarations are saved with the plan; they are not automatic
              electrical or hardware certification. Source file hashes are
              captured by the service without accepting library paths here.
            </p>
          </fieldset>
          <fieldset>
            <legend>Concurrent flows on this Runtime</legend>
            <p>
              The form defines primary. Add up to seven explicit flows sharing
              this bus, bitrate, evidence quota and one device reservation. CAN
              IDs select arbitration priority on a real bus; virtual tests do
              not model wire arbitration.
            </p>
            <button
              disabled={
                !!plan.adaptive ||
                !!flowError ||
                !receivers.length ||
                flows.length >= 7
              }
              onClick={addReverse}
            >
              Add reverse flow
            </button>
            <label>
              Additional flows (JSON)
              <textarea
                aria-label="Stress additional flows"
                rows={12}
                maxLength={65536}
                value={flowsText}
                onChange={(e) => setFlowsText(e.target.value)}
                spellCheck={false}
              />
            </label>
            {flowError && <p role="alert">{flowError}</p>}
            <p>
              Each flow freezes its own count, rate, ID, tag, criteria and
              optional timing/RTT. Later edits to primary do not rewrite this
              JSON. Shared channels use one acquisition; stopping a flow does
              not stop a channel used by another flow.
            </p>
          </fieldset>
        </details>
        <fieldset>
          <legend>Expected receivers</legend>
          {channels
            .filter((c) => c.id !== sender)
            .map((c) => (
              <label key={c.id} className="stress-check">
                <input
                  type="checkbox"
                  checked={receivers.includes(c.id)}
                  onChange={(e) =>
                    setReceivers(
                      e.target.checked
                        ? [...receivers, c.id]
                        : receivers.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.label}
              </label>
            ))}
        </fieldset>
        <label className="stress-check">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          Normal receiver mode (participates in CAN ACK, no generated data
          frames)
        </label>
        <button onClick={() => void check()}>Validate stress plan</button>
        {validation && (
          <p data-testid="stress-validation">
            Plan validated · tracking{" "}
            {(validation.tracking_bytes / 1048576).toFixed(2)} MiB /{" "}
            {(validation.memory_limit_bytes / 1048576).toFixed(0)} MiB ·
            evidence {disk} MiB · maximum {validation.max_fps} frames/s
          </p>
        )}
        {validation?.load_budget && (
          <p data-testid="stress-load-budget">
            Frozen reservation: up to {validation.load_budget.reserved_planned}{" "}
            physical frames · peak {validation.load_budget.reserved_peak_fps}{" "}
            frames/s · maximum {validation.load_budget.maximum_quantum_frames}{" "}
            per host quantum · estimated evidence{" "}
            {(
              validation.load_budget.estimated_evidence_bytes / 1048576
            ).toFixed(2)}{" "}
            MiB. Adaptive reservation covers all candidates and the largest
            possible measurement; the final plan contains only the selected
            path.
          </p>
        )}
        {validation?.group_budget && (
          <p data-testid="stress-group-budget">
            Group: {validation.group_budget.flow_count} flows ·{" "}
            {validation.group_budget.channels.length} channels ·{" "}
            {validation.group_budget.devices.length} devices · reserved peak{" "}
            {validation.group_budget.peak_transmit_fps} frames/s (including RTT
            responses) · maximum in flight{" "}
            {validation.group_budget.maximum_inflight} · tracking + reserve{" "}
            {(
              (validation.group_budget.tracking_bytes +
                validation.group_budget.memory_reserve_bytes) /
              1048576
            ).toFixed(1)}{" "}
            MiB · evidence estimate{" "}
            {(
              validation.group_budget.estimated_evidence_bytes / 1048576
            ).toFixed(1)}{" "}
            MiB
          </p>
        )}
        <label className="stress-check">
          <input
            aria-label="Authorize stress transmission"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          I authorize transmission on the selected test bus.
        </label>
        <button
          onClick={() => void start()}
          disabled={
            !validation || !active || !!pending || !scope || !!flowError
          }
        >
          Start stress test
        </button>
      </fieldset>
      {pending && (
        <div role="status">
          Unresolved start request: {pending}{" "}
          <button disabled={busy} onClick={() => void recover()}>
            Recover stress start result
          </button>
        </div>
      )}
      {!!error && (
        <ErrorRecovery
          error={error}
          context="stress"
          busy={busy}
          onDismiss={() => setError(null)}
          onCheck={() => void refreshStatus()}
        />
      )}
      {runs.length > 0 && (
        <label>
          Recorded run
          <select
            aria-label="Stress run"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              selectedRef.current = e.target.value;
              setReport(null);
            }}
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id.slice(0, 8)} · {r.state} · {r.verdict}
              </option>
            ))}
          </select>
        </label>
      )}
      {report && (
        <div data-testid="stress-report">
          <div className="panel-heading">
            <h3>
              Run {report.id.slice(0, 8)} · {report.state}
            </h3>
            <button
              disabled={busy || terminal(report.state)}
              onClick={() => void stop()}
            >
              Stop stress test
            </button>
          </div>
          <div className="stress-totals">
            <strong>
              {report.submitted.toLocaleString()} /{" "}
              {report.planned.toLocaleString()} submitted
            </strong>
            <span>
              Skipped {report.skipped} · failed {report.failed} · unknown{" "}
              {report.unknown}
            </span>
            <span>
              Verdict: {report.verdict} · evidence{" "}
              {report.evidence.complete ? "complete" : "not complete"}
            </span>
            <span>
              Scheduling quantum {report.scheduling_quantum_ns / 1e6} ms · RX
              lag events {report.rx_lag_events} · evidence queue high water{" "}
              {report.evidence.queue_high_water}
            </span>
            <span>
              Process peak RSS:{" "}
              {history.at(-1)?.process_peak_rss_bytes != null
                ? `${((history.at(-1)?.process_peak_rss_bytes ?? 0) / 1048576).toFixed(1)} MiB`
                : "unavailable"}{" "}
              · counters{" "}
              {report.counters_complete ? "current" : "checkpoint only"}
            </span>
          </div>
          <details>
            <summary>Frozen acceptance criteria</summary>
            <pre>
              {JSON.stringify(report.plan.criteria ?? defaultCriteria, null, 2)}
            </pre>
          </details>
          {report.assessment && (
            <div data-testid="stress-assessment">
              Criteria: {report.assessment.passed ? "met" : "not met"} ·
              workload {report.assessment.workload_met ? "met" : "not met"}
              {report.assessment.failures.length > 0 && (
                <ul>
                  {report.assessment.failures.map((f, index) => (
                    <li key={index}>
                      {f.criterion}
                      {f.channel ? ` · ${f.channel}` : ""}
                      {f.stage != null ? ` · stage ${f.stage}` : ""}: {f.actual}
                      {f.denominator != null ? ` / ${f.denominator}` : ""} ·
                      limit {f.limit}
                      {f.denominator != null ? " ppm" : ""}
                    </li>
                  ))}
                </ul>
              )}
              <p>
                Criteria met is separate from complete evidence and completed
                execution.
              </p>
            </div>
          )}
          {report.provenance && (
            <details data-testid="stress-provenance">
              <summary>Software and selected library source evidence</summary>
              <p>
                Version {report.provenance.package_version} ·{" "}
                {report.provenance.os} / {report.provenance.architecture} ·{" "}
                {report.provenance.scope}
              </p>
              <p>
                Service executable SHA-256:{" "}
                {report.provenance.executable.sha256 ?? "unknown"} ·{" "}
                {report.provenance.executable.status}
              </p>
              {report.provenance.channels.map((c) => (
                <div key={c.channel}>
                  <p>
                    {c.channel} · {c.backend} · {c.device_id} · firmware{" "}
                    {c.firmware}
                  </p>
                  {c.libraries.length ? (
                    c.libraries.map((f, index) => (
                      <p key={index}>
                        {f.name} · SHA-256 {f.sha256 ?? "unknown"} ·{" "}
                        {f.bytes ?? "unknown"} bytes · {f.status}
                      </p>
                    ))
                  ) : (
                    <p>
                      Selected dynamic library evidence: unavailable / not
                      applicable
                    </p>
                  )}
                </div>
              ))}
              {report.plan.topology && (
                <pre>{JSON.stringify(report.plan.topology, null, 2)}</pre>
              )}
            </details>
          )}
          {report.timing && (
            <div data-testid="stress-timing">
              <h3>Sampled host timing</h3>
              <p>
                {report.timing.scope} · every {report.plan.timing?.sample_every}{" "}
                sequences · window high water {report.timing.window_high_water}{" "}
                / {report.plan.timing?.max_pending} · pending{" "}
                {report.timing.pending} · evicted {report.timing.evicted} ·
                unsettled at retirement {report.timing.abandoned} ·{" "}
                {report.timing.finalized ? "finalized" : "in progress"}
              </p>
              <p>
                Request sampling: {report.timing.request.submitted} /{" "}
                {report.plan.rtt?.role === "responder" ? 0 : report.submitted}{" "}
                known request submissions. Response sampling:{" "}
                {report.timing.response.submitted} /{" "}
                {report.rtt_report?.responder_submitted ?? 0} known response
                submissions.
              </p>
              {report.timing.error && <p role="alert">{report.timing.error}</p>}
              {(
                [
                  ["Request", report.timing.request],
                  ["Response", report.timing.response],
                ] as const
              ).map(([name, t]) => (
                <div key={name}>
                  <p>
                    {name}: {t.samples} measured submissions · submitted{" "}
                    {t.submitted} · failed {t.failed} · unknown {t.unknown} ·
                    worker queue unavailable {t.worker_queue_unknown}
                  </p>
                  <p>
                    {(
                      [
                        "preparation",
                        "dispatch_wait",
                        "worker_queue",
                        "submit_call",
                        "completion_wait",
                        "total",
                      ] as const
                    )
                      .map(
                        (key) =>
                          `${key}: p99 ${t[key].p99_upper_ns == null ? "unknown" : `${(t[key].p99_upper_ns / 1e6).toFixed(3)} ms`}, max ${t[key].samples === 0 ? "unknown" : `${(t[key].max_ns / 1e6).toFixed(3)} ms`}, n=${t[key].samples}`,
                      )
                      .join(" · ")}
                  </p>
                </div>
              ))}
              {report.timing.receivers.map((t) => (
                <div key={t.channel}>
                  <p>
                    {t.channel}: matched {t.matched} /{" "}
                    {report.timing!.request.submitted} sampled known submissions
                    · coverage{" "}
                    {report.timing!.request.submitted
                      ? `${((t.matched * 100) / report.timing!.request.submitted).toFixed(2)}%`
                      : "unknown"}{" "}
                    · sampled RX {t.sampled_rx} · unmatched RX {t.unmatched_rx}{" "}
                    · missing or pending {t.missing_sampled_submitted}
                  </p>
                  <p>
                    Signed RX latency: negative samples{" "}
                    {t.latency.negative_magnitude.samples} · p50 / p95 / p99
                    upper bounds{" "}
                    {[
                      t.latency.p50_upper_ns,
                      t.latency.p95_upper_ns,
                      t.latency.p99_upper_ns,
                    ]
                      .map((n) =>
                        n == null ? "unknown" : `${(n / 1e6).toFixed(3)} ms`,
                      )
                      .join(" / ")}{" "}
                    · min{" "}
                    {t.latency.min_ns == null
                      ? "unknown"
                      : `${(t.latency.min_ns / 1e6).toFixed(3)} ms`}{" "}
                    · max{" "}
                    {t.latency.max_ns == null
                      ? "unknown"
                      : `${(t.latency.max_ns / 1e6).toFixed(3)} ms`}
                  </p>
                </div>
              ))}
              <p>
                Coverage is limited to sampled sequences and the retained
                matching window, separate from full online frame verification.
              </p>
              <details>
                <summary>Timing histograms and sample counts</summary>
                <pre>{JSON.stringify(report.timing, null, 2)}</pre>
              </details>
            </div>
          )}
          {report.group && (
            <div data-testid="stress-group-report">
              <h3>Concurrent flow results</h3>
              <p>
                {report.group.evidence_scope} · group evidence{" "}
                {report.evidence.complete
                  ? "complete"
                  : "writing or incomplete"}{" "}
                · reserved peak {report.group.budget.peak_transmit_fps} frames/s
                · release{" "}
                {report.group.start_ns == null
                  ? "not released"
                  : `${(report.group.start_ns / 1e9).toFixed(3)} s`}
              </p>
              {report.group.budget.devices.map((d) => (
                <p key={d.device_id}>
                  {d.device_id}: {d.channels.join(", ")} · reserved{" "}
                  {d.peak_transmit_fps} frames/s
                </p>
              ))}
              {report.group.flows.map((f) => (
                <article key={f.name} data-testid={`stress-flow-${f.name}`}>
                  <h4>
                    {f.name} · CAN 0x
                    {f.report.plan.can_id.toString(16).toUpperCase()}{" "}
                    {f.report.plan.extended ? "extended" : "standard"}
                  </h4>
                  <p>
                    {f.report.plan.sender} →{" "}
                    {f.report.plan.receivers.join(", ")} · {f.report.state} ·
                    verifier {f.report.verdict} (requires group evidence)
                  </p>
                  <p>
                    Submitted {f.report.submitted} / {f.report.planned} ·
                    skipped {f.report.skipped} · failed {f.report.failed} ·
                    unknown {f.report.unknown}
                  </p>
                  {f.report.receivers.map((r) => (
                    <p key={r.channel}>
                      {r.channel}: unique {r.unique} · missing planned/submitted{" "}
                      {r.missing_expected}/{r.missing_submitted} · duplicates{" "}
                      {r.duplicates} · reordered {r.reordered} · CRC/pattern
                      errors {r.crc_errors}/{r.pattern_errors}
                    </p>
                  ))}
                  <LoadDetails report={f.report} />
                  <ClassicPatternDetails report={f.report} />
                  <ResourceDetails report={f.report} />
                  {f.report.rtt_report && (
                    <p>
                      RTT samples {f.report.rtt_report.latency.samples} ·
                      responses submitted{" "}
                      {f.report.rtt_report.responder_submitted} · unknown
                      responses {f.report.rtt_report.responder_unknown}
                    </p>
                  )}
                  {f.report.timing?.receivers.map((r) => (
                    <p key={r.channel}>
                      Timing {r.channel}: matched {r.matched} /{" "}
                      {f.report.timing!.request.submitted} sampled submissions ·
                      unmatched RX {r.unmatched_rx}
                    </p>
                  ))}
                  {report.group!.stop_requests[f.name] != null && (
                    <p>
                      Stop requested at{" "}
                      {(report.group!.stop_requests[f.name] / 1e9).toFixed(3)} s
                    </p>
                  )}
                  <button
                    disabled={
                      terminal(f.report.state) ||
                      f.report.state.startsWith("saving_") ||
                      report.group!.stop_requests[f.name] != null
                    }
                    onClick={() => void stopFlow(f.name)}
                  >
                    Stop flow {f.name}
                  </button>
                  <details>
                    <summary>Frozen flow plan, criteria and evidence</summary>
                    <pre>{JSON.stringify(f.report, null, 2)}</pre>
                  </details>
                </article>
              ))}
              <p>
                Group totals include locally generated RTT responses. A skipped
                request also leaves its planned response opportunity unused.
                Per-flow counters retain their request/responder semantics.
              </p>
            </div>
          )}
          {report.integrity && <p>Payload verification: {report.integrity}</p>}
          <LoadDetails report={report} />
          {report.adaptive && (
            <div data-testid="stress-adaptive">
              <h3>Adaptive exploration and fixed measurement</h3>
              <p>{report.adaptive.scope}</p>
              <p>
                Phase {report.adaptive.phase} · selected rate{" "}
                {report.adaptive.selected_fps ?? "none"} frames/s · reserved
                maximum {report.adaptive.reserved_planned} frames / peak{" "}
                {report.adaptive.reserved_peak_fps} frames/s
              </p>
              {report.adaptive.steps.map((s) => (
                <article key={s.name} data-testid={`stress-adaptive-${s.name}`}>
                  <h4>
                    {s.name} · input {s.report.plan.fps} physical frames/s ·{" "}
                    {s.report.state}
                  </h4>
                  <p>
                    Submitted {s.report.submitted} / {s.report.planned} ·
                    skipped {s.report.skipped} · verifier {s.report.verdict}
                  </p>
                  <LoadDetails report={s.report} />
                  <p>
                    RX evidence interval:{" "}
                    {s.report.plan.evidence?.sample_every ?? 0} (0 means online
                    aggregates, 1 means full matching RX replay). Step
                    verification requires parent evidence.
                  </p>
                  {s.decision ? (
                    <p>
                      Criteria {s.decision.criteria.passed ? "met" : "not met"}{" "}
                      · qualified {String(s.decision.qualified)} · reason{" "}
                      {s.decision.reason} · next {s.decision.next ?? "none"}
                    </p>
                  ) : (
                    <p>Decision pending</p>
                  )}
                  <ClassicPatternDetails report={s.report} />
                  <ResourceDetails report={s.report} />
                  <details>
                    <summary>
                      Frozen step, actual load and decision evidence
                    </summary>
                    <pre>{JSON.stringify(s, null, 2)}</pre>
                  </details>
                </article>
              ))}
            </div>
          )}
          <ClassicPatternDetails report={report} />
          <ResourceDetails report={report} />
          {report.rtt_report && (
            <p>
              RTT (initiator host observations):{" "}
              {report.rtt_report.latency.samples} samples · p99 upper bound{" "}
              {report.rtt_report.latency.p99_upper_ns == null
                ? "unavailable"
                : `${(report.rtt_report.latency.p99_upper_ns / 1e6).toFixed(3)} ms`}{" "}
              · timeouts {report.rtt_report.timed_out} · responses submitted{" "}
              {report.rtt_report.responder_submitted} · response unknown{" "}
              {report.rtt_report.responder_unknown}
            </p>
          )}
          {report.plan.coordination && (
            <p>
              Coordinated group {report.plan.coordination.group_id} ·{" "}
              {report.plan.coordination.participant} · clocks{" "}
              {report.plan.coordination.clock_quality}; one-way cross-host
              latency unavailable
            </p>
          )}
          {report.lifecycle?.termination && (
            <p role="status">
              Stopped: {report.lifecycle.termination.code} ·{" "}
              {report.lifecycle.termination.detail}
            </p>
          )}
          {report.lifecycle?.stop_requested_ns != null && (
            <p>
              Stop requested at{" "}
              {(report.lifecycle.stop_requested_ns / 1e9).toFixed(3)} s · last
              attempted sequence{" "}
              {report.lifecycle.last_attempt_sequence ?? "none"} · unresolved
              sequence {report.unknown_sequence ?? "none"}
            </p>
          )}
          {report.recovery?.status && (
            <p>
              Evidence verification: {report.recovery.status} · RX scope{" "}
              {report.recovery.sample_coverage} · submission scope{" "}
              {report.recovery.submission_coverage ?? "legacy aggregates"} ·
              valid prefix {report.recovery.valid_prefix_bytes.toLocaleString()}{" "}
              bytes · damaged files {report.recovery.damaged_files}
              {report.recovery.counters_are_lower_bounds
                ? " · recovered counters are lower bounds"
                : ""}
            </p>
          )}
          {report.backend_cleanup?.map((c) => (
            <p key={c.channel}>
              Backend cleanup {c.channel}: {c.scope} · unconfirmed accounting{" "}
              {c.backend_unconfirmed ?? "unknown"} (separate from submission
              outcome unknown)
            </p>
          ))}
          {report.stability?.status && (
            <p>
              Memory monitor: {report.stability.status} · maximum RSS growth{" "}
              {(report.stability.max_growth_bytes / 1048576).toFixed(1)} MiB
            </p>
          )}
          {series.length > 0 && (
            <figure>
              <figcaption>
                Host submission rate (frames/s) · observed vs{" "}
                {report.group || report.adaptive ? "reserved peak" : "target"} ·
                last {Math.round(tMax - tMin)} seconds
              </figcaption>
              <svg
                viewBox="0 0 780 220"
                role="img"
                aria-label="Stress submission rate chart"
              >
                <line x1="50" y1="180" x2="740" y2="180" />
                <line x1="50" y1="30" x2="50" y2="180" />
                <text x="5" y="32">
                  {Math.round(maxY)}
                </text>
                <text x="25" y="180">
                  0
                </text>
                <text x="50" y="198">
                  {Math.round(tMin)}
                </text>
                <text x="710" y="198">
                  {Math.round(tMax)}
                </text>
                <text x="320" y="210">
                  Elapsed time (seconds)
                </text>
                <polyline className="stress-target" points={points("target")} />
                <polyline className="stress-observed" points={points("fps")} />
              </svg>
              <small>
                Solid: observed host submissions · dashed:{" "}
                {report.group || report.adaptive
                  ? "conservative aggregate reserved peak, not a dynamic target"
                  : "target"}
                . Neither measures bus occupancy or physical ACK.
              </small>
            </figure>
          )}
          {report.receivers.length > 0 && (
            <table>
              <caption>Peer RX observations</caption>
              <thead>
                <tr>
                  <th>Receiver</th>
                  <th>Unique</th>
                  <th>Expected not observed</th>
                  <th>Submitted missing</th>
                  <th>Duplicates</th>
                  <th>Reordered</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {report.receivers.map((r) => (
                  <tr key={r.channel}>
                    <td>{r.channel}</td>
                    <td>{r.unique}</td>
                    <td>{r.missing_expected}</td>
                    <td>
                      {terminal(report.state) ? r.missing_submitted : "pending"}
                    </td>
                    <td>{r.duplicates}</td>
                    <td>{r.reordered}</td>
                    <td>
                      {r.evidence_complete ? "complete" : "incomplete"} · CRC
                      errors {r.crc_errors ?? 0} · pattern errors{" "}
                      {r.pattern_errors ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <details>
            <summary>Stage results</summary>
            {report.stages.map((s, i) => (
              <p key={i}>
                {s.name} · {s.warmup ? "warmup" : "measurement"} · {s.fps}{" "}
                frames/s · {s.submitted}/{s.count} submitted · {s.skipped}{" "}
                skipped · RX {s.received_unique.join(", ")}
              </p>
            ))}
          </details>
          {report.errors.map((e, i) => (
            <p key={i} role="alert">
              {e}
            </p>
          ))}
          {artifacts && (
            <details>
              <summary>
                Evidence files · {report.evidence.bytes.toLocaleString()} stream
                bytes
              </summary>
              <ul>
                {artifacts.files.map((f) => (
                  <li key={f.name}>
                    <a
                      download
                      href={`/api/v1/stress/runs/${report.id}/artifacts/${encodeURIComponent(f.name)}`}
                    >
                      {f.name}
                    </a>{" "}
                    · {f.bytes} bytes <small>SHA-256 {f.sha256}</small>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p>
            Refresh only reconnects the display. Pausing or closing this page
            does not stop an authorized test. Stored samples are not a complete
            capture.
          </p>
        </div>
      )}
    </section>
  );
}

function ClassicPatternDetails({ report }: { report: StressReport }) {
  if (report.plan.traffic?.format !== "classic_pattern_v1" || report.group)
    return null;
  const tx = report.classic_pattern_transmit;
  return (
    <div data-testid="stress-classic-pattern">
      <h4>Classic pattern-v1 / independent checkpoint</h4>
      <p>
        Physical planned frames {report.planned}: {report.planned / 2}{" "}
        checkpoints + {report.planned / 2} data · control CAN ID 0x
        {report.plan.traffic.checkpoint_can_id.toString(16).toUpperCase()} ·
        window {report.plan.traffic.max_pending} per receiver · full raw
        evidence
      </p>
      {tx && (
        <p>
          Submitted checkpoints / data {tx.checkpoint_submitted} /{" "}
          {tx.data_submitted} · skipped {tx.checkpoint_skipped} /{" "}
          {tx.data_skipped} · failed {tx.checkpoint_failed} / {tx.data_failed} ·
          unknown {tx.checkpoint_unknown} / {tx.data_unknown}
        </p>
      )}
      {report.receivers.map(
        (r) =>
          r.classic_pattern && (
            <p key={r.channel}>
              {r.channel}: checkpoints {r.classic_pattern.checkpoints_unique} ·
              verified data {r.classic_pattern.data_verified_unique} · missing
              checkpoints {r.classic_pattern.missing_checkpoints} · unverified
              data {r.classic_pattern.unverified_data} · ambiguous{" "}
              {r.classic_pattern.ambiguous_data} · invalid envelopes{" "}
              {r.classic_pattern.invalid_envelopes} · pending{" "}
              {r.classic_pattern.pending_data} · window high water{" "}
              {r.classic_pattern.window_high_water} · evictions{" "}
              {r.classic_pattern.checkpoint_evictions} ·{" "}
              {r.classic_pattern.finalized ? "finalized" : "provisional"}
            </p>
          ),
      )}
    </div>
  );
}

function LoadDetails({ report }: { report: StressReport }) {
  const l = report.load;
  if (!l) return null;
  return (
    <p data-testid="stress-observed-load">
      Observed host load: {(l.actual_fps_milli / 1000).toFixed(3)} frames/s ·
      submitted {l.submitted} · skipped {l.skipped} · window{" "}
      {(Math.max(0, l.end_ns - l.start_ns) / 1e9).toFixed(3)} s / declared{" "}
      {(l.scheduled_duration_ns / 1e9).toFixed(3)} s ·{" "}
      {l.completed ? "completed" : "interrupted"}. Backend submissions, not
      measured bus occupancy.
    </p>
  );
}

function ResourceDetails({ report }: { report: StressReport }) {
  if (
    (!report.plan.tracking && !report.plan.queues) ||
    !report.receivers.length
  )
    return null;
  return (
    <details open data-testid="stress-resources">
      <summary>Tracking and queue observations</summary>
      {report.receivers.map((r) => (
        <div key={r.channel}>
          <p>
            {r.channel}:{" "}
            {r.tracking
              ? `sliding capacity ${r.tracking.capacity} · base ${r.tracking.base} · finalized through ${r.tracking.finalized_through} · ${r.tracking.finalized ? "history frozen" : "active window"} · retired unique ${r.tracking.unique_retired} · frozen expected missing ${r.tracking.finalized_missing_expected} · frozen submitted missing ${r.tracking.finalized_missing_submitted} · late ${r.tracking.late_after_window} · future ${r.tracking.future_outside_window}`
              : "exact bitmap"}
          </p>
          {r.queues && (
            <div>
              <p>
                Sampled RX depth high water {r.queues.observed_high_water} ·
                residence samples {r.queues.samples} · p99 upper{" "}
                {r.queues.residence.p99_upper_ns == null
                  ? "unavailable"
                  : `${(r.queues.residence.p99_upper_ns / 1e6).toFixed(3)} ms`}{" "}
                · invalid timestamps {r.queues.invalid_timestamps}. Host receive
                queue only; sampled lower bound, not wire latency.
              </p>
              <details data-testid="stress-residence-distribution">
                <summary>Residence distribution · {r.channel}</summary>
                <p>
                  Valid {r.queues.residence.samples} · negative{" "}
                  {r.queues.residence.negative} · overflow{" "}
                  {r.queues.residence.overflow} · max{" "}
                  {(r.queues.residence.max_ns / 1e6).toFixed(3)} ms · p50 / p95
                  upper {r.queues.residence.p50_upper_ns ?? "unknown"} /{" "}
                  {r.queues.residence.p95_upper_ns ?? "unknown"} ns
                </p>
                <ol>
                  {r.queues.residence.bins.map((n, i) => (
                    <li key={i}>
                      ≤ {1000 * 2 ** i} ns: {n}
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          )}
        </div>
      ))}
    </details>
  );
}
