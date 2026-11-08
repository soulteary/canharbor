// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiFailure } from "./api";
export function recoveryAdvice(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = error instanceof ApiFailure ? error.status : undefined;
  if (status === 401 || status === 403)
    return {
      message,
      next: "Run canharbor web open in a terminal to open a fresh pairing link. Links expire after 60 seconds and work once. Checking the connection does not redeem the old link.",
      check: true,
    };
  if (status === 409 || status === 412 || status === 428)
    return {
      message,
      next: "Refresh session status. Another client may hold control or the configuration may have changed. Review the selected session before explicitly acquiring control or applying settings again.",
      check: true,
    };
  if (status === 400 || status === 422)
    return {
      message,
      next: "Review the channel settings and input requirements. Virtual channels use 500 kbit/s nominal and 2 Mbit/s CAN FD data bitrate. Correct the values before submitting again.",
      check: false,
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
    next: "Review the current channel and submission history. Reconnect the event stream explicitly if disconnected; sending and control are never restored automatically.",
    check: true,
  };
}
