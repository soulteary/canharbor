// SPDX-License-Identifier: AGPL-3.0-or-later
// Generated from Rust wire DTOs. Do not edit.
import type { Contract } from "./api";
interface Validator<T> {
  (value: unknown): value is T;
  errors?: readonly { instancePath?: string; message?: string }[] | null;
}
export const auth: Validator<Contract["auth"]>;
export const capabilities: Validator<Contract["capabilities"]>;
export const capture: Validator<Contract["capture"]>;
export const capture_request: Validator<Contract["capture_request"]>;
export const captures: Validator<Contract["captures"]>;
export const config: Validator<Contract["config"]>;
export const counter: Validator<Contract["counter"]>;
export const create_request: Validator<Contract["create_request"]>;
export const devices: Validator<Contract["devices"]>;
export const diagnostics: Validator<Contract["diagnostics"]>;
export const error: Validator<Contract["error"]>;
export const frame_input: Validator<Contract["frame_input"]>;
export const legal: Validator<Contract["legal"]>;
export const pair_link: Validator<Contract["pair_link"]>;
export const pair_request: Validator<Contract["pair_request"]>;
export const receipt_lookup: Validator<Contract["receipt_lookup"]>;
export const session: Validator<Contract["session"]>;
export const sessions: Validator<Contract["sessions"]>;
export const stream_message: Validator<Contract["stream_message"]>;
export const subscribe: Validator<Contract["subscribe"]>;
export const tx: Validator<Contract["tx"]>;
export const tx_receipt: Validator<Contract["tx_receipt"]>;
export const version: Validator<Contract["version"]>;
