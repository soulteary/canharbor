// SPDX-License-Identifier: AGPL-3.0-or-later
import { recoveryAdvice } from "./recovery";
export function ErrorRecovery({
  error,
  busy,
  onCheck,
  onDismiss,
}: {
  error: unknown;
  busy: boolean;
  onCheck: () => void;
  onDismiss: () => void;
}) {
  const advice = recoveryAdvice(error);
  return (
    <section
      role="alert"
      className="alert"
      aria-label="Operation recovery"
      style={{ position: "sticky", top: 8, zIndex: 5 }}
    >
      <strong>{advice.message}</strong>
      <p>{advice.next}</p>
      {advice.check && (
        <button disabled={busy} onClick={onCheck}>
          Check connection and session status
        </button>
      )}
      <button onClick={onDismiss}>Dismiss error</button>
    </section>
  );
}
