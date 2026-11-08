// SPDX-License-Identifier: AGPL-3.0-or-later
import { recoveryAdvice, type RecoveryContext } from "./recovery";
export function ErrorRecovery({
  error,
  context = "general",
  busy,
  onCheck,
  onDismiss,
}: {
  error: unknown;
  context?: RecoveryContext;
  busy: boolean;
  onCheck: () => void;
  onDismiss: () => void;
}) {
  const advice = recoveryAdvice(error, context);
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
          {context === "recording"
            ? "Refresh recordings"
            : context === "stress"
              ? "Refresh stress status"
              : "Check connection and session status"}
        </button>
      )}
      <button onClick={onDismiss}>Dismiss error</button>
    </section>
  );
}
