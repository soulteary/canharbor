// SPDX-License-Identifier: AGPL-3.0-or-later
// Service captures and native/CLI download readers share a 64 MiB bound.
export const MAX_SERVICE_CAPTURE_BYTES = 64 * 1024 * 1024;
export async function recordingFile(
  id: string,
  signal: AbortSignal,
): Promise<File> {
  const response = await fetch(
    `/api/v1/captures/${encodeURIComponent(id)}/download`,
    {
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
      signal,
    },
  );
  if (!response.ok)
    throw new Error(
      `Could not read recording (HTTP ${response.status}). Refresh recordings and try viewing again; this does not start acquisition.`,
    );
  if (!response.body) throw new Error("Recording response has no file body.");
  const declared = response.headers.get("content-length");
  if (
    declared !== null &&
    (!/^\d+$/.test(declared) ||
      BigInt(declared) > BigInt(MAX_SERVICE_CAPTURE_BYTES))
  ) {
    await response.body.cancel();
    throw new Error(
      "Recording exceeds the 64 MiB service download limit. Open an existing local file in Offline analysis (up to 1 GiB).",
    );
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_SERVICE_CAPTURE_BYTES)
        throw new Error("Recording exceeds the 64 MiB service download limit.");
      chunks.push(new Uint8Array(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (declared !== null && BigInt(total) !== BigInt(declared))
    throw new Error(
      "Recording download was interrupted. View it again to read the complete file.",
    );
  return new File(chunks, `${id}.ndjson`, { type: "application/x-ndjson" });
}
