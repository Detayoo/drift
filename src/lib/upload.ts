export type UploadResult = {
  id: string;
  filename: string;
  bytes: number;
  ms: number;
};

export const MAX_UPLOAD_BYTES = 5 * 1024 ** 3;

/** Shared client-side gate, mirrored by the server. Returns the problem or null. */
export function validateFile(file: File): string | null {
  if (file.size === 0) return "That file is empty — pick one with content.";
  if (file.size > MAX_UPLOAD_BYTES) return "That file is over the 5 GB limit.";
  return null;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0 B";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = n / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

/**
 * Uploads a file as a raw binary stream. Bytes are counted as they leave
 * (never buffered), so progress is exact and memory stays flat.
 */
export async function uploadFile(
  file: File,
  onProgress: (sent: number) => void,
  opts?: { baseUrl?: string; grant?: string; signal?: AbortSignal },
): Promise<UploadResult> {
  let sent = 0;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      sent += chunk.byteLength;
      onProgress(sent);
      controller.enqueue(chunk);
    },
  });

  const base = (opts?.baseUrl ?? "").replace(/\/+$/, "");
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-drift-filename": encodeURIComponent(file.name),
      "x-drift-size": String(file.size),
      "x-drift-type": file.type || "application/octet-stream",
      ...(opts?.grant ? { "x-drift-grant": opts.grant } : {}),
    },
    body: file.stream().pipeThrough(counter),
    duplex: "half",
    signal: opts?.signal,
  };
  const res = await fetch(`${base}/api/transfers`, init);

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Upload failed (HTTP ${res.status}).`);
  }
  return (await res.json()) as UploadResult;
}
