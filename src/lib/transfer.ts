import { formatBytes, type UploadResult } from "@/lib/upload";

export type TransferStatus = "idle" | "uploading" | "verifying" | "done" | "error" | "cancelled";

export type TransferSnapshot = {
  status: TransferStatus;
  fileName: string;
  size: number;
  sent: number;
  speedBps: number | null;
  etaSec: number | null;
  result: UploadResult | null;
  error: string | null;
};

export type TransferTransport = (
  file: File,
  onProgress: (sent: number) => void,
  signal: AbortSignal,
) => Promise<UploadResult>;

const SPEED_WINDOW_MS = 1500;
const MIN_SAMPLE_DT_S = 0.2;

export function formatSpeed(bps: number | null): string {
  if (bps === null || !Number.isFinite(bps) || bps <= 0) return "Starting…";
  return `${formatBytes(Math.round(bps))}/s`;
}

export function formatEta(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec)) return "";
  if (sec < 1) return "almost done";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `about ${m}m ${s}s left` : `about ${s}s left`;
}

/**
 * One transfer's explicit state machine, independent of any UI.
 * Instances are independent, so concurrent transfers just work —
 * there is deliberately no global lock. Inject a fake transport
 * to test the machine without touching the network.
 */
export function createTransfer(file: File, transport: TransferTransport) {
  let snapshot: TransferSnapshot = {
    status: "idle",
    fileName: file.name,
    size: file.size,
    sent: 0,
    speedBps: null,
    etaSec: null,
    result: null,
    error: null,
  };
  const listeners = new Set<() => void>();
  let controller: AbortController | null = null;
  let samples: Array<{ t: number; bytes: number }> = [];
  let started = false;

  const emit = () => {
    listeners.forEach((fn) => fn());
  };

  const measure = (sent: number) => {
    const now = Date.now();
    samples.push({ t: now, bytes: sent });
    while (samples.length > 1 && now - samples[0].t > SPEED_WINDOW_MS) samples.shift();
    const first = samples[0];
    const dt = (now - first.t) / 1000;
    const speed = dt >= MIN_SAMPLE_DT_S ? Math.max(0, (sent - first.bytes) / dt) : null;
    snapshot = {
      ...snapshot,
      sent,
      speedBps: speed,
      etaSec: speed ? (file.size - sent) / speed : null,
    };
    emit();
  };

  const start = async () => {
    if (started) return;
    started = true;
    controller = new AbortController();
    samples = [{ t: Date.now(), bytes: 0 }];
    snapshot = { ...snapshot, status: "uploading", sent: 0, speedBps: null, etaSec: null, result: null, error: null };
    emit();
    try {
      const result = await transport(file, measure, controller.signal);
      snapshot = { ...snapshot, status: "verifying" };
      emit();
      if (result.bytes !== file.size) {
        snapshot = { ...snapshot, status: "error", error: `Only ${result.bytes} of ${file.size} bytes landed. Nothing was kept.` };
      } else {
        snapshot = { ...snapshot, status: "done", sent: file.size, speedBps: null, etaSec: null, result };
      }
    } catch (err) {
      snapshot = controller?.signal.aborted
        ? { ...snapshot, status: "cancelled" }
        : { ...snapshot, status: "error", error: err instanceof Error ? err.message : "Transfer failed." };
    }
    emit();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    start: () => {
      void start();
    },
    cancel: () => {
      controller?.abort();
    },
    retry: () => {
      started = false;
      void start();
    },
    reset: () => {
      started = false;
      controller = null;
      samples = [];
      snapshot = {
        status: "idle",
        fileName: file.name,
        size: file.size,
        sent: 0,
        speedBps: null,
        etaSec: null,
        result: null,
        error: null,
      };
      emit();
    },
  };
}
