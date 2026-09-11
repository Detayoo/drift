import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const MAX_TRANSFER_BYTES = 5 * 1024 ** 3;
export const TRANSFER_PARTIAL_TTL_MS = 24 * 60 * 60 * 1000;

export type StoredRecord = {
  filename: string;
  size: number;
  received: number;
  sha256: string | null;
  completedAt: number | null;
  createdAt: number;
};

export class ResumeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function safeName(raw: string): string {
  const base = path.basename(raw).replace(/[^\w.\-()[\] ]/g, "_").slice(0, 180);
  return base || "file";
}

export function finalName(key: string, filename: string): string {
  return `${key}-${filename}`;
}

function partName(key: string, filename: string): string {
  return `${finalName(key, filename)}.part`;
}

function sidecar(dir: string, key: string): string {
  return path.join(dir, `${key}.json`);
}

function validKey(key: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(key);
}

async function removeRecord(dir: string, key: string, filename?: string): Promise<void> {
  await fs.rm(sidecar(dir, key), { force: true });
  if (filename) {
    await fs.rm(path.join(dir, partName(key, filename)), { force: true });
    await fs.rm(path.join(dir, finalName(key, filename)), { force: true });
  }
}

async function writeRecord(dir: string, key: string, record: StoredRecord): Promise<void> {
  await fs.writeFile(sidecar(dir, key), JSON.stringify(record));
}

async function readRecord(dir: string, key: string, ttlMs: number): Promise<StoredRecord | null> {
  if (!validKey(key)) return null;
  let record: StoredRecord | null = null;
  try {
    record = JSON.parse(await fs.readFile(sidecar(dir, key), "utf8")) as StoredRecord;
  } catch {
    return null;
  }
  if (!record || typeof record.filename !== "string" || typeof record.size !== "number") {
    return null;
  }
  if (Date.now() - record.createdAt > ttlMs) {
    await removeRecord(dir, key, record.filename).catch(() => null);
    return null;
  }
  return record;
}

/** Best-effort checkpoint: a missed write only costs a few megabytes of re-send. */
export function noteProgress(dir: string, key: string, received: number): void {
  fs.readFile(sidecar(dir, key), "utf8")
    .then((raw) => {
      const record = JSON.parse(raw) as StoredRecord;
      if (received <= record.received) return null;
      record.received = received;
      return fs.writeFile(sidecar(dir, key), JSON.stringify(record));
    })
    .catch(() => null);
}

export async function sweepRecords(dir: string, ttlMs: number): Promise<void> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return;
  }
  const now = Date.now();
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const record = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as StoredRecord;
      if (now - record.createdAt > ttlMs) {
        await removeRecord(dir, name.slice(0, -".json".length), record.filename);
      }
    } catch {
      continue;
    }
  }
}

/**
 * Opens a resumable write. Throws ResumeError (with HTTP status) for every
 * mismatch so routes stay thin: one try/catch maps to the response.
 */
export async function prepareWrite(opts: {
  dir: string;
  key: string;
  rawFilename: string;
  size: number;
  offset: number;
  ttlMs: number;
}): Promise<{ dest: string; filename: string; append: boolean }> {
  const { dir, key, size, offset, ttlMs } = opts;
  if (!validKey(key)) throw new ResumeError("Unknown transfer. Start over.", 400);
  const filename = safeName(opts.rawFilename);
  if (!filename) throw new ResumeError("Missing file name. The sender must name it.", 400);
  if (!Number.isFinite(size) || size <= 0)
    throw new ResumeError("Missing file size. The sender must declare it.", 400);
  if (size > MAX_TRANSFER_BYTES) throw new ResumeError("That file is larger than the 5 GB limit.", 413);
  if (!Number.isInteger(offset) || offset < 0 || offset > size)
    throw new ResumeError("Bad resume offset. Start over.", 400);

  await fs.mkdir(dir, { recursive: true });
  const record = await readRecord(dir, key, ttlMs);
  if (!record && offset > 0) {
    throw new ResumeError("Nothing kept for that transfer. Start over.", 409);
  }
  if (record && (record.filename !== filename || record.size !== size)) {
    throw new ResumeError("That transfer changed. Start over.", 409);
  }
  if (record && offset !== record.received) {
    throw new ResumeError(
      `Kept ${record.received} of ${size} bytes. Resume from there or start over.`,
      409,
    );
  }
  if (!record) {
    await writeRecord(dir, key, {
      filename,
      size,
      received: 0,
      sha256: null,
      completedAt: null,
      createdAt: Date.now(),
    });
  } else if (offset > 0) {
    await fs.truncate(path.join(dir, partName(key, filename)), record.received).catch(() => null);
  }
  return { dest: path.join(dir, partName(key, filename)), filename, append: offset > 0 };
}

/**
 * Finalizes a write: exact byte count, then a SHA-256 receipt over what
 * landed (recorded for later dedup — it proves the bytes, paired with
 * the count proving completeness). Finalizes the record and promotes
 * the partial to its final name.
 */
export async function commitWrite(opts: {
  dir: string;
  key: string;
  filename: string;
  size: number;
  ttlMs: number;
}): Promise<string> {
  const { dir, key, filename, size, ttlMs } = opts;
  const part = path.join(dir, partName(key, filename));
  let stat;
  try {
    stat = await fs.stat(part);
  } catch {
    throw new ResumeError("The transfer vanished mid-write. Send again.", 500);
  }
  if (stat.size > size) {
    await removeRecord(dir, key, filename).catch(() => null);
    throw new ResumeError("More bytes arrived than declared. Start over.", 422);
  }
  if (stat.size !== size) {
    const prev = await readRecord(dir, key, ttlMs);
    await writeRecord(dir, key, {
      filename,
      size,
      received: stat.size,
      sha256: null,
      completedAt: null,
      createdAt: prev?.createdAt ?? Date.now(),
    });
    throw new ResumeError(`Only ${stat.size} of ${size} bytes arrived. Kept — resume to continue.`, 422);
  }
  const digest = await hashFile(part);
  await fs.rename(part, path.join(dir, finalName(key, filename)));
  await writeRecord(dir, key, {
    filename,
    size,
    received: size,
    sha256: digest,
    completedAt: Date.now(),
    createdAt: Date.now(),
  });
  return digest;
}

export async function hashFile(full: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(
    createReadStream(full),
    new Writable({
      write(chunk, _encoding, callback) {
        hash.update(chunk as Buffer);
        callback();
      },
    }),
  );
  return hash.digest("hex");
}

/** Probe view for resume: how much is kept, and the receipt if complete. */
export async function readResumeView(
  dir: string,
  key: string,
  ttlMs: number,
): Promise<{
  received: number;
  complete: { filename: string; size: number; sha256: string; createdAt: number } | null;
}> {
  const record = await readRecord(dir, key, ttlMs);
  if (!record) return { received: 0, complete: null };
  if (record.completedAt && record.sha256) {
    return {
      received: record.size,
      complete: { filename: record.filename, size: record.size, sha256: record.sha256, createdAt: record.createdAt },
    };
  }
  return { received: record.received, complete: null };
}

export async function deleteResume(dir: string, key: string): Promise<boolean> {
  if (!validKey(key)) return false;
  const record = await readRecord(dir, key, Number.MAX_SAFE_INTEGER);
  if (!record) return false;
  await removeRecord(dir, key, record.filename).catch(() => null);
  return true;
}
