// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiFailure } from "./api";
export type RecoveryContext = "general" | "channel" | "recording" | "stress";
export function recoveryAdvice(
  error: unknown,
  context: RecoveryContext = "general",
) {
  const message = error instanceof Error ? error.message : String(error);
  const status = error instanceof ApiFailure ? error.status : undefined;
  const code = error instanceof ApiFailure ? error.detail?.code : undefined;
  const subject =
    context === "recording"
      ? "recording name, duration and source session"
      : context === "stress"
        ? "test plan, selected channels and resource limits"
        : "channel settings and frame fields";
  if (status === 401)
    return {
      message,
      next: "Run canharbor web open in a terminal to open a fresh pairing link. Links expire after 60 seconds and work once. Checking the connection does not redeem the old link.",
      check: true,
    };
  if (status === 403)
    return {
      message,
      next: "The service denied this request. Check browser access and session status first. If access has expired, run canharbor web open for a fresh pairing link. Pairing links work once; this error can also indicate an access or request-verification failure.",
      check: true,
    };
  if (code === "lease_expired")
    return {
      message,
      next: "Control has expired. Refresh status, then explicitly acquire control and start the channel if needed. Nothing is resumed automatically.",
      check: true,
    };
  if (code === "lease_conflict" || code === "device_busy")
    return {
      message,
      next: "Another session or client holds this resource. Refresh status and review the owner before explicitly acquiring control. Do not repeat the operation until the resource is available.",
      check: true,
    };
  if (status === 409 || status === 412 || status === 428)
    return {
      message,
      next: "Refresh session status. Review the selected session and current configuration before explicitly applying changes again. For recordings, an existing request identifier may refer to different settings.",
      check: true,
    };
  if (status === 400 || status === 422)
    return {
      message,
      next: `Review the ${subject}. The service message identifies the rejected value; correct it before submitting again.`,
      check: false,
    };
  if (status === 404)
    return {
      message,
      next: "Refresh the list: this resource may have expired or been removed. A missing submission or run result does not prove that execution never occurred.",
      check: true,
    };
  if (status === 429)
    return {
      message,
      next: "The service reached a resource limit. Review active recordings, sessions and tests, then explicitly stop unneeded work before trying again.",
      check: true,
    };
  if (
    error instanceof TypeError ||
    (error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)) ||
    (status !== undefined && status >= 500)
  )
    return {
      message,
      next: "Check that the local service is running, then check the connection. A failed response can leave an operation's outcome unknown. Review session status and submission history before repeating an operation.",
      check: true,
    };
  return {
    message,
    next: "Review the current resource and submission history. Reconnect explicitly if disconnected; sending and control are never restored automatically.",
    check: true,
  };
}
