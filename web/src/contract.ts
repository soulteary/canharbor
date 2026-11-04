// SPDX-License-Identifier: AGPL-3.0-or-later
import * as validators from "./generated/api-validators.js";
import type { Contract } from "./generated/api";
export type ContractName = keyof Contract;
export type Payload<K extends ContractName> = Contract[K];
export function decode<K extends ContractName>(
  name: K,
  value: unknown,
): Payload<K> {
  const validate = validators[name];
  if (!validate(value)) {
    const errors = validate.errors
      ?.map((error) => `${error.instancePath ?? ""} ${error.message ?? ""}`)
      .join("; ");
    throw new Error(`Invalid ${name} payload: ${errors}`);
  }
  return value as Payload<K>;
}
