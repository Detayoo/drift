import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INBOX = path.join(process.cwd(), ".localdrop-inbox");
const MAX_BYTES = 5 * 1024 ** 3;

export type ReceivedFile = {
  id: string;
  filename: string;
  bytes: number;
  receivedAt: string;
};

function safeName(raw: string): string {
  const base = path.basename(raw).replace(/[^\w.\-()[\] ]/g, "_").slice(0, 180);
  return base || "file";
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const id = randomUUID().slice(0, 8);
  const log = (...args: unknown[]) => console.log(`[transfer ${id}]`, ...args);

  if (!req.body) return fail("Empty request body. Nothing was sent.", 400);

  const rawName = req.headers.get("x-localdrop-filename");
  if (!rawName || !rawName.trim()) return fail("Missing file name. The sender must name it.", 400);

  let filename = "";
  try {
    filename = safeName(decodeURIComponent(rawName));
  } catch {
    return fail("The file name could not be read. Try renaming it.", 400);
  }
  if (!filename) filename = "file";

  const declared = Number(req.headers.get("x-localdrop-size") ?? NaN);
  if (!Number.isFinite(declared) || declared <= 0)
    return fail("Missing file size. The sender must declare it.", 400);
  if (declared > MAX_BYTES)
    return fail(`That file is larger than the 5 GB Phase 1 limit.`, 413);

  await fs.mkdir(INBOX, { recursive: true });
  const stored = `${id}-${filename}`;
  const dest = path.join(INBOX, stored);
  const started = Date.now();
  log(`begin "${filename}" (${declared} bytes)`);

  let received = 0;
  let nextMark = 0.25;
  const tap = new PassThrough();
  tap.on("data", (chunk: Buffer) => {
    received += chunk.length;
    if (received / declared >= nextMark && nextMark < 1) {
      log(`${Math.round(nextMark * 100)}% (${received}/${declared} bytes)`);
      nextMark += 0.25;
    }
  });

  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), tap, createWriteStream(dest));
  } catch (err) {
    await fs.rm(dest, { force: true });
    log("stream failed:", err instanceof Error ? err.message : err);
    return fail("The connection broke mid-transfer. Nothing was kept.", 500);
  }

  const stat = await fs.stat(dest);
  if (stat.size !== declared) {
    await fs.rm(dest, { force: true });
    log(`incomplete: kept ${stat.size}/${declared} bytes, discarded`);
    return fail(`Only ${stat.size} of ${declared} bytes arrived. Nothing was kept.`, 422);
  }

  const ms = Date.now() - started;
  log(`persisted ${stat.size} bytes in ${ms}ms -> ${stored}`);
  return NextResponse.json(
    { id, filename, bytes: stat.size, ms },
    { headers: { "x-transfer-id": id } },
  );
}

export async function GET() {
  await fs.mkdir(INBOX, { recursive: true });
  const names = await fs.readdir(INBOX);
  const files: ReceivedFile[] = [];
  for (const stored of names) {
    const cut = stored.indexOf("-");
    if (cut <= 0) continue;
    try {
      const stat = await fs.stat(path.join(INBOX, stored));
      if (!stat.isFile()) continue;
      files.push({
        id: stored.slice(0, cut),
        filename: stored.slice(cut + 1),
        bytes: stat.size,
        receivedAt: stat.mtime.toISOString(),
      });
    } catch {
      continue;
    }
  }
  files.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  return NextResponse.json({ files });
}
