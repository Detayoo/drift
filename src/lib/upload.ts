import { fetchJson, isNetworkFailure, readError } from "@/lib/http";

export type UploadResult = {
  id: string;
  filename: string;
  bytes: number;
  ms: number;
  sha256?: string;
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

type Headers = Record<string, string>;

function uploadStreamed(
  file: File,
  target: string,
  headers: Headers,
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
 * Fallback for engines without upload streaming. The File (or its slice)
 * goes as one body with real progress events. The offset shifts progress
 * so bars always show total bytes, never just this attempt's.
 */
function uploadXhr(
  body: Blob,
  target: string,
  headers: Headers,
  offset: number,
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
      if (e.lengthComputable) onProgress(offset + e.loaded);
    };
    xhr.onload = () => {
      let parsed: UploadResult | { error?: string } | null = null;
      try {
        parsed = JSON.parse(xhr.responseText) as UploadResult;
      } catch {
        parsed = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && parsed && !("error" in parsed)) {
        resolve(parsed);
      } else {
        const message =
          parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
            ? parsed.error
            : `Upload failed (HTTP ${xhr.status}).`;
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new TypeError("Failed to fetch"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.send(body);
  });
}

async function finishUpload(res: Promise<Response>): Promise<UploadResult> {
  const done = await res;
  if (!done.ok) throw new Error(await readError(done, "Upload failed"));
  return (await done.json()) as UploadResult;
}

export type ResumeProbe = {
  received: number;
  complete: {
    filename: string;
    bytes: number;
    sha256?: string;
    pickupPath?: string;
    expiresAt?: number;
  } | null;
};

/**
 * Uploads a file as raw binary with resume. The stable key (offer id or
 * client uuid) addresses a server-side checkpoint: the probe reports kept
 * bytes, the remainder streams after them, and a lost acknowledgement
 * returns the completed receipt without re-sending a single byte.
 * Memory stays flat on both transports — the file is never buffered.
 */
export async function uploadFile(
  file: File,
  onProgress: (sent: number) => void,
  opts?: {
    baseUrl?: string;
    path?: string;
    probePath?: string;
    grant?: string;
    signal?: AbortSignal;
    resumeKey?: string;
    onResumeKey?: (key: string) => void;
  },
): Promise<UploadResult> {
  const base = (opts?.baseUrl ?? "").replace(/\/+$/, "");
  const target = `${base}${opts?.path ?? "/api/transfers"}`;
  const key = opts?.resumeKey ?? crypto.randomUUID().slice(0, 8);
  opts?.onResumeKey?.(key);

  let offset = 0;
  if (opts?.probePath) {
    try {
      const probe = await fetchJson<ResumeProbe>(`${base}${opts.probePath}?transferId=${encodeURIComponent(key)}`);
      if (probe.complete && probe.complete.bytes === file.size) {
        onProgress(file.size);
        return {
          id: key,
          filename: probe.complete.filename,
          bytes: probe.complete.bytes,
          ms: 0,
          sha256: probe.complete.sha256,
          pickupPath: probe.complete.pickupPath,
          expiresAt: probe.complete.expiresAt,
        };
      }
      offset = Math.min(Math.max(0, probe.received), file.size);
    } catch {
      offset = 0;
    }
  }

  const headers: Headers = {
    "content-type": "application/octet-stream",
    "x-drift-filename": encodeURIComponent(file.name),
    "x-drift-size": String(file.size),
    "x-drift-type": file.type || "application/octet-stream",
    "x-drift-transfer": key,
    "x-drift-offset": String(offset),
    ...(opts?.grant ? { "x-drift-grant": opts.grant } : {}),
  };
  const shifted = (n: number) => onProgress(offset + n);

  if (!supportsStreamingUpload()) {
    return uploadXhr(offset > 0 ? file.slice(offset) : file, target, headers, offset, shifted, opts?.signal);
  }
  let streamed = 0;
  try {
    const source = offset > 0 ? file.slice(offset) : file;
    const counter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        streamed += chunk.byteLength;
        shifted(streamed);
        controller.enqueue(chunk);
      },
    });
    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      headers,
      body: source.stream().pipeThrough(counter),
      duplex: "half",
      signal: opts?.signal,
    };
    return await finishUpload(fetch(target, init));
  } catch (err) {
    if (streamed > 0 || !isNetworkFailure(err)) throw err;
    return uploadXhr(offset > 0 ? file.slice(offset) : file, target, headers, offset, shifted, opts?.signal);
  }
}
