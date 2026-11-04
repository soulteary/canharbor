// SPDX-License-Identifier: AGPL-3.0-or-later
export interface Session {
  id: string;
  channel_id: string;
  mode: "active" | "listen_only";
  state: "configured" | "running";
  revision: string;
  generation: string;
  controller: string | null;
}
export interface Frame {
  kind: "classic_data" | "classic_remote" | "fd_data";
  id: number;
  extended: boolean;
  brs: boolean;
  data_hex: string;
  dlc?: number;
}
export interface BusEvent {
  type: "frame_received";
  sequence: string;
  host_monotonic_ns: string;
  direction: "rx" | "tx";
  timestamp_quality: string;
  frame: Frame;
}
export interface Device {
  id: string;
  label: string;
  simulated: boolean;
  channels: { id: string; label: string }[];
}
export interface Auth {
  client_id: string;
  csrf_token: string;
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  auth?: Auth,
  generation?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["X-CANHarbor-CSRF"] = auth.csrf_token;
  if (generation) headers["X-CANHarbor-Lease-Generation"] = generation;
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error?.message ?? `Request failed (${response.status})`,
    );
  return data as T;
}
export function validateFrame(
  kind: Frame["kind"],
  idText: string,
  extended: boolean,
  dataText: string,
  brs: boolean,
  rtrDlc: number,
): Frame {
  if (!/^[0-9a-fA-F]+$/.test(idText))
    throw new Error("Enter a hexadecimal ID without a prefix.");
  const id = Number.parseInt(idText, 16);
  if (!Number.isSafeInteger(id) || id > (extended ? 0x1fffffff : 0x7ff))
    throw new Error("ID exceeds the selected width.");
  const data_hex = dataText.replace(/\s/g, "").toUpperCase();
  if (!/^(?:[0-9A-F]{2})*$/.test(data_hex))
    throw new Error("Data must contain complete hexadecimal bytes.");
  const length = data_hex.length / 2;
  if (kind === "classic_remote") {
    if (
      data_hex ||
      brs ||
      !Number.isInteger(rtrDlc) ||
      rtrDlc < 0 ||
      rtrDlc > 8
    )
      throw new Error("RTR requires an empty payload and DLC 0–8.");
    return { kind, id, extended, brs: false, data_hex: "", dlc: rtrDlc };
  }
  if (kind === "classic_data" && (length > 8 || brs))
    throw new Error("Classic CAN allows up to 8 bytes and no BRS.");
  if (
    kind === "fd_data" &&
    ![0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 32, 48, 64].includes(length)
  )
    throw new Error("Use an exact CAN FD wire length (up to 64 bytes).");
  return { kind, id, extended, brs, data_hex };
}
