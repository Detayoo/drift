import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { streamToFile } from "@/server/files";
import { consumeGrant, finishOffer, markProgress } from "@/server/offers";
import { TRANSFER_PARTIAL_TTL_MS, commitWrite, noteProgress, prepareWrite, ResumeError } from "@/server/resumable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INBOX = path.join(process.cwd(), ".drift-inbox");

export type ReceivedFile = {
  id: string;
  filename: string;
  bytes: number;
  receivedAt: string;
};

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const id = randomUUID().slice(0, 8);
  const log = (...args: unknown[]) => console.log(`[transfer ${id}]`, ...args);

  if (!req.body) return fail("Empty request body. Nothing was sent.", 400);

  let rawName = "";
  try {
    rawName = decodeURIComponent(req.headers.get("x-drift-filename") ?? "");
  } catch {
    return fail("The file name could not be read. Try renaming it.", 400);
  }
  const declared = Number(req.headers.get("x-drift-size") ?? NaN);
  const offset = Number(req.headers.get("x-drift-offset") ?? 0);

  const grant = req.headers.get("x-drift-grant");
  const grantOffer = grant ? consumeGrant(grant) : null;
  if (grant && !grantOffer) {
    return fail("That transfer approval expired or was already used.", 403);
  }
  const key = grantOffer ? grantOffer.id : req.headers.get("x-drift-transfer") ?? "";

  let opened;
  try {
    opened = await prepareWrite({ dir: INBOX, key, rawFilename: rawName, size: declared, offset, ttlMs: TRANSFER_PARTIAL_TTL_MS });
  } catch (err) {
    if (grantOffer) finishOffer(grantOffer.id, false);
    return err instanceof ResumeError ? fail(err.message, err.status) : fail("Couldn't start the transfer.", 500);
  }

  const started = Date.now();
  log(`${offset > 0 ? `resuming "${opened.filename}"` : `begin "${opened.filename}"`} (${declared} bytes, from ${offset})`);

  let nextMark = 0.25;
  const onBytes = (sessionBytes: number) => {
    const total = offset + sessionBytes;
    if (grantOffer) markProgress(grantOffer.id, total, declared);
    noteProgress(INBOX, key, total);
    if (total / declared >= nextMark && nextMark < 1) {
      log(`${Math.round(nextMark * 100)}% (${total}/${declared} bytes)`);
      nextMark += 0.25;
    }
  };

  try {
    await streamToFile(
      Readable.fromWeb(req.body as import("node:stream/web").ReadableStream),
      opened.dest,
      onBytes,
      { append: offset > 0 },
    );
  } catch (err) {
    if (grantOffer) finishOffer(grantOffer.id, false);
    log("stream broke, partial kept:", err instanceof Error ? err.message : err);
    return fail("The connection broke mid-transfer. What's here is kept — resume to continue.", 500);
  }

  let digest: string;
  try {
    digest = await commitWrite({ dir: INBOX, key, filename: opened.filename, size: declared, ttlMs: TRANSFER_PARTIAL_TTL_MS });
  } catch (err) {
    if (grantOffer) finishOffer(grantOffer.id, false);
    return err instanceof ResumeError ? fail(err.message, err.status) : fail("Couldn't finish the transfer.", 500);
  }

  const ms = Date.now() - started;
  if (grantOffer) finishOffer(grantOffer.id, true);
  log(`persisted ${declared} bytes in ${ms}ms, sha256 ${digest.slice(0, 12)}…`);
  return NextResponse.json(
    { id, filename: opened.filename, bytes: declared, ms, sha256: digest, ...(grantOffer ? { offerId: grantOffer.id } : {}) },
    { headers: { "x-transfer-id": id } },
  );
}

export async function GET() {
  await fs.mkdir(INBOX, { recursive: true });
  const names = await fs.readdir(INBOX);
  const files: ReceivedFile[] = [];
  for (const stored of names) {
    if (stored.endsWith(".part") || stored.endsWith(".json")) continue;
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
