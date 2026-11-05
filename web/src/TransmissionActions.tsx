// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { api, ApiFailure, type Auth, type FrameInput } from "./api";
import { decode } from "./contract";
import type { TxReceipt } from "./generated/api";
type Attempt = {
  session: string;
  request: string;
  generation: string;
  state: string;
};
const LIMIT = 16;
function read(key: string): Attempt[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw || raw.length > 16384) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > LIMIT) return [];
    return value.filter(
      (a): a is Attempt =>
        a &&
        typeof a === "object" &&
        Object.keys(a).sort().join() === "generation,request,session,state" &&
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
    );
  } catch {
    return [];
  }
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
    // IDs and results only: no frame payload, CSRF token, or control lease is restored.
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
      busy
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
      };
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
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="primary send"
        disabled={
          props.disabled || busy || !scope || scope.client !== auth?.client_id
        }
        onClick={() => void submit()}
      >
        Send once <span>↗</span>
      </button>
      {!!scope?.attempts.length && (
        <section aria-label="Submission history">
          <p>
            Recent requests · results can be checked without acquiring control.
          </p>
          {scope.attempts.map((attempt) => (
            <div key={attempt.request}>
              <code>{attempt.request}</code> <span>{attempt.state}</span>{" "}
              <button
                disabled={busy}
                onClick={() => void check(attempt)}
                aria-label={`Check result ${attempt.request}`}
              >
                Check result
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
