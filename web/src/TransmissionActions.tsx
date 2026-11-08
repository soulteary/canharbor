// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { api, ApiFailure, type Auth, type FrameInput } from "./api";
import { decode } from "./contract";
import type { TxReceipt } from "./generated/api";
type AttemptContext = {
  at: string;
  channel?: string;
  kind: FrameInput["kind"];
  id: number;
  extended: boolean;
  bytes: number;
  brs: boolean;
};
type Attempt = {
  session: string;
  request: string;
  generation: string;
  state: string;
  context?: AttemptContext;
};
const LIMIT = 16;
function validContext(value: unknown): value is AttemptContext {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    Object.keys(c).every((key) =>
      ["at", "channel", "kind", "id", "extended", "bytes", "brs"].includes(key),
    ) &&
    typeof c.at === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(c.at) &&
    Number.isFinite(Date.parse(c.at)) &&
    (c.channel === undefined ||
      (typeof c.channel === "string" &&
        /^[^\x00-\x1f\x7f]{1,128}$/.test(c.channel))) &&
    ["classic_data", "classic_remote", "fd_data"].includes(String(c.kind)) &&
    typeof c.id === "number" &&
    Number.isInteger(c.id) &&
    c.id >= 0 &&
    c.id <= (c.extended ? 0x1fffffff : 0x7ff) &&
    typeof c.extended === "boolean" &&
    typeof c.brs === "boolean" &&
    typeof c.bytes === "number" &&
    Number.isInteger(c.bytes) &&
    c.bytes >= 0 &&
    c.bytes <= 64
  );
}
export function readAttempts(raw: string | null): Attempt[] {
  try {
    if (!raw || raw.length > 16384) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > LIMIT) return [];
    return value
      .filter(
        (a): a is Attempt =>
          a &&
          typeof a === "object" &&
          Object.keys(a).every((key) =>
            ["generation", "request", "session", "state", "context"].includes(
              key,
            ),
          ) &&
          typeof a.session === "string" &&
          /^[A-Za-z0-9_-]{1,128}$/.test(a.session) &&
          typeof a.request === "string" &&
          /^[a-f0-9-]{36}$/.test(a.request) &&
          typeof a.state === "string" &&
          [
            "pending",
            "submitted",
            "queued",
            "failed",
            "outcome_unknown",
            "rejected",
          ].includes(a.state) &&
          (() => {
            try {
              decode("counter", a.generation);
              return true;
            } catch {
              return false;
            }
          })(),
      )
      .map(({ context, ...attempt }) =>
        validContext(context) ? { ...attempt, context } : attempt,
      );
  } catch {
    return [];
  }
}
function read(key: string): Attempt[] {
  try {
    return readAttempts(sessionStorage.getItem(key));
  } catch {
    return [];
  }
}
function frameSummary(context: AttemptContext) {
  return `${context.kind === "fd_data" ? "CAN FD" : context.kind === "classic_remote" ? "RTR" : "Classic CAN"} · ID ${context.id.toString(16).toUpperCase()} (${context.extended ? "29-bit" : "11-bit"}) · ${context.bytes} bytes${context.brs ? " · BRS" : ""}`;
}
function description(receipt: TxReceipt): string {
  if (receipt.state === "submitted")
    return receipt.simulated
      ? "Submitted to virtual bus"
      : "Submitted to backend; bus delivery unconfirmed";
  return `Submission ${receipt.state}`;
}
export function TransmissionActions(props: {
  auth: Auth | null;
  session: string;
  channel?: string;
  generation?: string;
  disabled: boolean;
  frame: () => FrameInput;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
}) {
  const { auth } = props;
  const [scope, setScope] = useState<{
    key: string;
    client: string;
    attempts: Attempt[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const unresolved =
    scope?.attempts.filter((a) =>
      ["pending", "outcome_unknown"].includes(a.state),
    ) ?? [];
  const queryFirst = unresolved.some((a) => !checked.includes(a.request));
  const newSendBlocked = unresolved.length > 0 && (queryFirst || !acknowledged);
  useEffect(() => {
    setChecked([]);
    setAcknowledged(false);
  }, [scope?.key]);
  useEffect(() => {
    let alive = true;
    setScope(null);
    if (auth)
      void api("version", "/version")
        .then((version) => {
          if (!alive) return;
          const key = `canharbor:receipts:${version.server_instance_id}:${auth.client_id}`;
          setScope({ key, client: auth.client_id, attempts: read(key) });
        })
        .catch((e) => {
          if (alive) props.onError(String(e));
        });
    return () => {
      alive = false;
    };
  }, [auth]);
  function remember(attempt: Attempt) {
    if (!scope) return;
    const attempts = [
      attempt,
      ...scope.attempts.filter((a) => a.request !== attempt.request),
    ].slice(0, LIMIT);
    setScope({ ...scope, attempts });
    // Bounded identifiers and summaries only. Payload and credentials are never stored.
    try {
      sessionStorage.setItem(scope.key, JSON.stringify(attempts));
    } catch {
      /* In-memory history still works. */
    }
  }
  async function submit() {
    if (
      !auth ||
      !scope ||
      scope.client !== auth.client_id ||
      !props.generation ||
      busy ||
      props.disabled ||
      newSendBlocked
    )
      return;
    let attempt: Attempt | undefined;
    setBusy(true);
    props.onError("");
    try {
      const frame = props.frame();
      attempt = {
        session: props.session,
        generation: props.generation,
        request: crypto.randomUUID(),
        state: "pending",
        context: {
          at: new Date().toISOString(),
          ...(props.channel && /^[^\x00-\x1f\x7f]{1,128}$/.test(props.channel)
            ? { channel: props.channel }
            : {}),
          kind: frame.kind,
          id: frame.id,
          extended: frame.extended ?? false,
          bytes:
            frame.kind === "classic_remote"
              ? (frame.dlc ?? 0)
              : (frame.data_hex?.length ?? 0) / 2,
          brs: frame.brs ?? false,
        },
      };
      setAcknowledged(false);
      remember(attempt);
      const result = await api(
        "tx_receipt",
        `/sessions/${attempt.session}/tx`,
        "POST",
        { client_request_id: attempt.request, frame },
        auth,
        attempt.generation,
      );
      remember({ ...attempt, state: result.state });
      props.onNotice(`${description(result)} · ${result.receipt}`);
    } catch (e) {
      if (!attempt) props.onError(e instanceof Error ? e.message : String(e));
      else if (e instanceof ApiFailure && !e.unknown) {
        remember({ ...attempt, state: "rejected" });
        props.onError(e.message);
      } else {
        remember({ ...attempt, state: "outcome_unknown" });
        props.onError(
          `Transmission outcome unknown. Do not resend automatically. Request: ${attempt.request}. Use Check result to query without sending.`,
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function check(attempt: Attempt) {
    if (busy) return;
    setBusy(true);
    props.onError("");
    try {
      const query = new URLSearchParams({
        client_request_id: attempt.request,
        generation: attempt.generation,
      });
      const result = await api(
        "tx_receipt",
        `/sessions/${attempt.session}/tx?${query}`,
      );
      remember({ ...attempt, state: result.state });
      props.onNotice(`${description(result)} · ${result.receipt}`);
    } catch (e) {
      props.onError(
        e instanceof ApiFailure && e.status === 404
          ? "Receipt unavailable: it may be pending, expired, or from an earlier service instance. This does not prove that no frame was sent. Do not resend automatically."
          : e instanceof Error
            ? e.message
            : String(e),
      );
    } finally {
      setChecked((old) =>
        [...old.filter((id) => id !== attempt.request), attempt.request].slice(
          -LIMIT,
        ),
      );
      setAcknowledged(false);
      setBusy(false);
    }
  }
  return (
    <>
      {unresolved.length > 0 && (
        <aside aria-label="Unconfirmed transmissions">
          <strong>Earlier transmissions have unconfirmed outcomes.</strong>
          <p>
            Check each original result below first. A missing or unavailable
            result does not prove that no frame was sent. Querying never sends a
            frame.
          </p>
          <label>
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={busy || queryFirst}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            I understand the earlier outcome is unconfirmed. Allow one new
            logical transmission, which may duplicate a physical effect.
          </label>
          {queryFirst && (
            <p>
              Use Check result for each unconfirmed request before acknowledging
              a new transmission.
            </p>
          )}
        </aside>
      )}
      <button
        className="primary send"
        disabled={
          props.disabled ||
          busy ||
          !scope ||
          scope.client !== auth?.client_id ||
          newSendBlocked
        }
        onClick={() => void submit()}
      >
        Send once <span>↗</span>
      </button>
      <p>
        Send once creates a new request using the current frame. To inspect an
        earlier request without sending, use Check result.
      </p>
      {!!scope?.attempts.length && (
        <section aria-label="Submission history">
          <p>
            Recent requests · results can be checked without acquiring control.
          </p>
          {scope.attempts.map((attempt) => (
            <div key={attempt.request}>
              <p>
                {attempt.context ? (
                  <>
                    <time dateTime={attempt.context.at}>
                      {new Date(attempt.context.at).toLocaleString()}
                    </time>{" "}
                    · {attempt.context.channel ?? `Session ${attempt.session}`}{" "}
                    · {frameSummary(attempt.context)}
                  </>
                ) : (
                  <>Earlier request · time and frame summary unavailable</>
                )}
              </p>
              <p>Session {attempt.session}</p>
              <code>{attempt.request}</code> <span>{attempt.state}</span>{" "}
              <button
                disabled={busy}
                onClick={() => void check(attempt)}
                aria-label={`Check result ${attempt.request}`}
              >
                Check result
              </button>
              <small>Read original result · does not send</small>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
