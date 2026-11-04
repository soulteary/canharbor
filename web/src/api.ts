// SPDX-License-Identifier: AGPL-3.0-or-later
import { decode, type ContractName, type Payload } from "./contract";
import type { Auth, FrameInput } from "./generated/api";
export type {
  Auth,
  FrameInput,
  Frame,
  Session,
  Device,
  BusEvent,
} from "./generated/api";
export async function api<K extends ContractName | "empty">(
  name: K,
  path: string,
  method = "GET",
  body?: unknown,
  auth?: Auth,
  generation?: string,
): Promise<
  K extends "empty" ? void : K extends ContractName ? Payload<K> : never
> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth?.csrf_token) headers["X-CANHarbor-CSRF"] = auth.csrf_token;
  if (generation) headers["X-CANHarbor-Lease-Generation"] = generation;
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });
  type Result = K extends "empty"
    ? void
    : K extends ContractName
      ? Payload<K>
      : never;
  if (response.status === 204) {
    if (name !== "empty") throw new Error("Unexpected empty API response");
    return undefined as Result;
  }
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(decode("error", data).error.message);
  if (name === "empty") throw new Error("Unexpected API response body");
  return decode(name as ContractName, data) as Result;
}
export function validateFrame(
  kind: FrameInput["kind"],
  idText: string,
  extended: boolean,
  dataText: string,
  brs: boolean,
  rtrDlc: number,
): FrameInput {
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
