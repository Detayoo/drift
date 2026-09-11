import { isNetworkFailure, readError } from "@/lib/http";

export type UploadResult = {
  id: string;
  filename: string;
  bytes: number;
  ms: number;
  stageId?: string;
  pickupPath?: string;
  expiresAt?: number;
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

let streamingCache: boolean | null = null;

/**
 * Safari and Firefox reject streaming upload bodies. Probe once with a
 * throwaway Request (never sent) and remember the answer.
 */
export function supportsStreamingUpload(): boolean {
  if (streamingCache === null) {
    try {
      new Request("https://localhost/", {
        method: "POST",
        body: new ReadableStream(),
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      streamingCache = true;
    } catch {
      streamingCache = false;
    }
  }
  return streamingCache;
}

function uploadStreamed(
  file: File,
  target: string,
  headers: Record<string, string>,
  onProgress: (sent: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  let sent = 0;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      sent += chunk.byteLength;
      onProgress(sent);
      controller.enqueue(chunk);
    },
  });
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers,
    body: file.stream().pipeThrough(counter),
    duplex: "half",
    signal,
  };
  return finishUpload(fetch(target, init));
}

/**
 * Fallback for engines without upload streaming. The File goes as one
 * body (the browser streams it off disk) with real progress events.
 */
function uploadXhr(
  file: File,
  target: string,
  headers: Record<string, string>,
  onProgress: (sent: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", target);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      let body: { error?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText) as { error?: string };
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as UploadResult);
      else reject(new Error(body?.error ?? `Upload failed (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new TypeError("Failed to fetch"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.send(file);
  });
}

async function finishUpload(res: Promise<Response>): Promise<UploadResult> {
  const done = await res;
  if (!done.ok) throw new Error(await readError(done, "Upload failed"));
  return (await done.json()) as UploadResult;
}

/**
 * Uploads a file as raw binary. Streaming engines count exact bytes as
 * they leave; the rest fall back to XHR progress. Memory stays flat
 * either way — the file is never buffered in JavaScript.
 */
export async function uploadFile(
  file: File,
  onProgress: (sent: number) => void,
  opts?: { baseUrl?: string; path?: string; grant?: string; signal?: AbortSignal },
): Promise<UploadResult> {
  const base = (opts?.baseUrl ?? "").replace(/\/+$/, "");
  const target = `${base}${opts?.path ?? "/api/transfers"}`;
  const headers: Record<string, string> = {
    "content-type": "application/octet-stream",
    "x-drift-filename": encodeURIComponent(file.name),
    "x-drift-size": String(file.size),
    "x-drift-type": file.type || "application/octet-stream",
    ...(opts?.grant ? { "x-drift-grant": opts.grant } : {}),
  };

  if (!supportsStreamingUpload()) {
    return uploadXhr(file, target, headers, onProgress, opts?.signal);
  }
  let sent = 0;
  try {
    return await uploadStreamed(file, target, headers, (n) => {
      sent = n;
      onProgress(n);
    }, opts?.signal);
  } catch (err) {
    if (sent > 0 || !isNetworkFailure(err)) throw err;
    return uploadXhr(file, target, headers, onProgress, opts?.signal);
  }
}
