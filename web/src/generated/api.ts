// SPDX-License-Identifier: AGPL-3.0-or-later
// Generated from Rust wire DTOs. Run npm run api:generate --prefix web. Do not edit.

/**
 * Canonical u64 encoded as a decimal string to avoid JavaScript rounding.
 *
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Decimal".
 */
export type Decimal = string;
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "SessionMode".
 */
export type SessionMode = "active" | "listen_only";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "FrameKind".
 */
export type FrameKind = "classic_data" | "classic_remote" | "fd_data";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "FaultCode".
 */
export type FaultCode =
  | "device_disconnected"
  | "bus_off"
  | "receive_overflow"
  | "transmit_failed"
  | "stop_failed";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "SessionState".
 */
export type SessionState =
  "configured" | "running" | "faulted" | "disconnected";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "StreamMessage".
 */
export type StreamMessage =
  | {
      api_version: string;
      capacity: number;
      server_instance_id: string;
      session_epoch: string;
      type: "hello";
    }
  | {
      events: BusEvent[];
      server_instance_id: string;
      session_epoch: string;
      type: "events";
    }
  | {
      cause: GapCause;
      count: Decimal;
      type: "gap";
    }
  | {
      type: "resume_unavailable";
    }
  | {
      code: FaultCode;
      state: SessionState;
      type: "session_fault";
    };
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Direction".
 */
export type Direction = "rx" | "tx";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "TimestampQuality".
 */
export type TimestampQuality = "host_only";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "FrameEventKind".
 */
export type FrameEventKind = "frame_received";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "GapCause".
 */
export type GapCause = "subscriber_lag";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "SubscribeKind".
 */
export type SubscribeKind = "subscribe";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Confirmation".
 */
export type Confirmation = "virtual_bus_accepted";
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "TxState".
 */
export type TxState = "submitted";

/**
 * Catalog of wire types, not an HTTP response. Exported definitions describe
 * implemented M0 payloads; routing and authentication remain in the API design.
 */
export interface Contract {
  auth: Auth;
  counter: Decimal;
  create_request: CreateRequest;
  devices: Devices;
  diagnostics: Diagnostics;
  error: ApiErrorBody;
  frame_input: FrameInput;
  legal: Legal;
  pair_link: PairLink;
  pair_request: PairRequest;
  session: Session;
  sessions: Sessions;
  stream_message: StreamMessage;
  subscribe: Subscribe;
  tx: Tx;
  tx_receipt: TxReceipt;
  version: Version;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Auth".
 */
export interface Auth {
  client_id: string;
  csrf_token: string | null;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "CreateRequest".
 */
export interface CreateRequest {
  channel_id: string;
  config: Config;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Config".
 */
export interface Config {
  fd?: FdConfig | null;
  mode: SessionMode;
  nominal_bitrate: number;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "FdConfig".
 */
export interface FdConfig {
  data_bitrate: number;
  enabled: boolean;
  iso: boolean;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Devices".
 */
export interface Devices {
  devices: Device[];
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Device".
 */
export interface Device {
  backend: string;
  channels: Channel[];
  id: string;
  label: string;
  simulated: boolean;
  verification: string;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Channel".
 */
export interface Channel {
  fd: boolean;
  id: string;
  label: string;
  listen_only: boolean;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Diagnostics".
 */
export interface Diagnostics {
  hardware_backends: string[];
  session_count: number;
  stage: string;
  stream_capacity: number;
  ws_slots_available: number;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "ApiErrorBody".
 */
export interface ApiErrorBody {
  error: ErrorDetail;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "ErrorDetail".
 */
export interface ErrorDetail {
  code: string;
  message: string;
  request_id: string;
  retryable: boolean;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "FrameInput".
 */
export interface FrameInput {
  brs?: boolean;
  data_hex?: string;
  dlc?: number | null;
  extended?: boolean;
  id: number;
  kind: FrameKind;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Legal".
 */
export interface Legal {
  exact_source_archive: string | null;
  license: string;
  notice: string;
  source_url: string;
  stage: string;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "PairLink".
 */
export interface PairLink {
  url: string;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "PairRequest".
 */
export interface PairRequest {
  code: string;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Session".
 */
export interface Session {
  channel_id: string;
  controller: string | null;
  fault: FaultCode | null;
  generation: Decimal;
  id: string;
  mode: SessionMode;
  revision: Decimal;
  state: SessionState;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Sessions".
 */
export interface Sessions {
  sessions: Session[];
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "BusEvent".
 */
export interface BusEvent {
  direction: Direction;
  frame: Frame;
  host_monotonic_ns: Decimal;
  sequence: Decimal;
  timestamp_quality: TimestampQuality;
  type: FrameEventKind;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Frame".
 */
export interface Frame {
  brs: boolean;
  data_hex: string;
  dlc: number;
  extended: boolean;
  id: number;
  kind: FrameKind;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Subscribe".
 */
export interface Subscribe {
  after_sequence?: Decimal | null;
  csrf_token?: string | null;
  filter?: Filter;
  protocol_version: string;
  type: SubscribeKind;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Filter".
 */
export interface Filter {
  direction?: Direction | null;
  extended?: boolean | null;
  /**
   * @maxItems 256
   */
  ids?: number[];
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Tx".
 */
export interface Tx {
  client_request_id: string;
  frame: FrameInput;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "TxReceipt".
 */
export interface TxReceipt {
  confirmation: Confirmation;
  receipt: string;
  simulated: boolean;
  state: TxState;
}
/**
 * This interface was referenced by `Contract`'s JSON-Schema
 * via the `definition` "Version".
 */
export interface Version {
  api_version: string;
  server_instance_id: string;
  stage: string;
  version: string;
  web_ui: boolean;
}
