// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { api, ApiFailure, type Auth, type FrameInput } from "./api";
import type { PeriodicTask } from "./generated/api";
import {
  readTaskAttempts,
  recoverTask,
  taskTerminal,
  validateTaskPlan,
  type TaskAttempt,
} from "./tasks";
export function TaskPanel(props: {
  auth: Auth | null;
  session: string;
  generation?: string;
  disabled: boolean;
  frame: () => FrameInput;
  onError: (message: unknown) => void;
  onControlLost: () => void;
}) {
  const { auth } = props;
  const [count, setCount] = useState(10);
  const [interval, setIntervalValue] = useState(100);
  const [tasks, setTasks] = useState<PeriodicTask[]>([]);
  const [scope, setScope] = useState<{
    key: string;
    attempts: TaskAttempt[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function refresh() {
    try {
      const result = await api("periodic_tasks", "/tasks");
      if (alive.current) setTasks(result.tasks);
      return result.tasks;
    } catch (e) {
      if (e instanceof ApiFailure && [401, 403].includes(e.status))
        props.onControlLost();
      throw e;
    }
  }
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setScope(null);
    setTasks([]);
    if (!auth) return;
    const tick = async () => {
      try {
        const result = await api("periodic_tasks", "/tasks");
        if (active) setTasks(result.tasks);
      } catch (e) {
        if (active) {
          props.onError(e);
          if (e instanceof ApiFailure && [401, 403].includes(e.status))
            props.onControlLost();
        }
      }
      if (active) timer = setTimeout(tick, 1000);
    };
    void (async () => {
      try {
        const version = await api("version", "/version");
        if (!active) return;
        const key = `canharbor:tasks:${version.server_instance_id}:${auth.client_id}`;
        let attempts: TaskAttempt[] = [];
        try {
          attempts = readTaskAttempts(sessionStorage.getItem(key));
        } catch {
          /* storage can be unavailable */
        }
        setScope({ key, attempts });
        await tick();
      } catch (e) {
        if (active) props.onError(e);
      }
    })();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [auth]);
  async function start() {
    if (!auth || !scope || !props.generation || props.disabled || busy) return;
    let attempt: TaskAttempt | undefined;
    setBusy(true);
    props.onError("");
    setMessage("");
    try {
      validateTaskPlan(count, interval);
      const frame = props.frame();
      attempt = {
        session: props.session,
        generation: props.generation,
        request: crypto.randomUUID(),
      };
      const attempts = [attempt, ...scope.attempts].slice(0, 16);
      // Save only recovery identifiers, before admission. Never restore a lease,
      // frame, CSRF token, create request, or a timer that transmits frames.
      setScope({ ...scope, attempts });
      try {
        sessionStorage.setItem(scope.key, JSON.stringify(attempts));
      } catch {
        /* in-memory recovery still works */
      }
      const task = await api(
        "periodic_task",
        `/sessions/${attempt.session}/tasks`,
        "POST",
        {
          client_request_id: attempt.request,
          frame,
          count,
          interval_ms: interval,
        },
        auth,
        attempt.generation,
      );
      if (alive.current) {
        setTasks((old) => [task, ...old.filter((t) => t.id !== task.id)]);
        setMessage(
          "Task admitted. Dispatch runs in the service; this page renews only explicitly acquired control.",
        );
      }
    } catch (e) {
      if (alive.current) {
        if (attempt && (!(e instanceof ApiFailure) || e.unknown)) {
          setMessage(
            "Task start outcome unknown. Find the original task below; do not create a replacement automatically.",
          );
          props.onControlLost();
        }
        props.onError(e);
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function recover(attempt: TaskAttempt) {
    if (busy) return;
    setBusy(true);
    try {
      const found = recoverTask(await refresh(), attempt);
      if (alive.current)
        setMessage(
          found
            ? `Recovered task ${found.id}: ${found.state}. No control was acquired or renewed.`
            : "No retained task matches. Results may have expired or the service may have restarted; this does not prove nonexecution.",
        );
    } catch (e) {
      if (alive.current) props.onError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function cancel(task: PeriodicTask) {
    if (!auth || busy) return;
    setBusy(true);
    try {
      const result = await api(
        "periodic_task",
        `/tasks/${task.id}/cancel`,
        "POST",
        {},
        auth,
      );
      if (alive.current) {
        setTasks((old) => old.map((t) => (t.id === result.id ? result : t)));
        setMessage(
          "Cancellation requested. Inspect the final task result; issued frames cannot be recalled.",
        );
      }
    } catch (e) {
      if (alive.current) {
        props.onError(e);
        setMessage(
          "Cancellation response unavailable. Refresh the task result; cancellation is not assumed complete.",
        );
        props.onControlLost();
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  let planError = "";
  try {
    validateTaskPlan(count, interval);
  } catch (error) {
    planError = error instanceof Error ? error.message : String(error);
  }
  return (
    <section className="task-panel" aria-label="Periodic tasks">
      <h3>Periodic tasks</h3>
      <p>
        Uses the frame editor above. Requires a running active session and
        explicit control. Submission does not confirm bus delivery.
      </p>
      <div className="button-row">
        <label>
          Frame count
          <input
            aria-label="Frame count"
            type="number"
            min={1}
            max={6000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label>
          Task interval · ms
          <input
            aria-label="Task interval"
            type="number"
            min={10}
            max={60000}
            value={interval}
            onChange={(e) => setIntervalValue(Number(e.target.value))}
          />
        </label>
      </div>
      {planError ? (
        <p role="alert">{planError}</p>
      ) : (
        <p>
          Plan: {count} frames, {interval} ms apart; last dispatch after{" "}
          {(((count - 1) * interval) / 1000).toFixed(2)} seconds. Skipped slots
          are not retried.
        </p>
      )}
      <button
        disabled={!scope || !auth || props.disabled || busy || !!planError}
        onClick={() => void start()}
      >
        Start periodic task
      </button>
      <button
        disabled={!auth || busy}
        onClick={() => void refresh().catch((e) => props.onError(e))}
      >
        Refresh tasks
      </button>
      <p className="task-message" aria-live="polite">
        {message}
      </p>
      <p>
        Reloading restores results only. Control must be acquired explicitly; no
        task is restarted.
      </p>
      {tasks.map((task) => (
        <article
          key={task.id}
          data-testid={`task-${task.id}`}
          className="task-result"
        >
          <strong>Task {task.id}</strong>
          <div>
            Session {task.session_id} · generation {task.generation}
          </div>
          <div>Request {task.client_request_id}</div>
          <div>
            State: {task.state} ·{" "}
            {task.simulated ? "Simulation" : "Hardware unverified"}
          </div>
          <div>
            Submitted {task.submitted} / planned {task.planned} · skipped{" "}
            {task.skipped} · failed {task.failed} · unknown {task.unknown}
          </div>
          {task.reason && <div>{task.reason}</div>}
          <button
            disabled={busy || taskTerminal(task)}
            onClick={() => void cancel(task)}
          >
            Cancel task
          </button>
        </article>
      ))}
      {scope?.attempts.map((attempt) => (
        <div
          key={`${attempt.session}:${attempt.generation}:${attempt.request}`}
          className="task-attempt"
        >
          <code>{attempt.request}</code>
          <button
            disabled={busy || !auth}
            onClick={() => void recover(attempt)}
          >
            Find task
          </button>
        </div>
      ))}
    </section>
  );
}
