import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { streamToFile } from "@/server/files";
import { commitWrite, noteProgress, prepareWrite, ResumeError } from "@/server/resumable";
import { STAGE_TTL_MS, stageDir } from "@/server/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Stages a file on THIS server for pickup by a browser-only device.
 * The client transfer id IS the stage id, so a resume lands on the
 * same pickup link instead of orphaning a new one.
 */
export async function POST(req: NextRequest) {
  if (!req.body) return fail("Empty request body. Nothing was sent.", 400);

  let rawName = "";
  try {
    rawName = decodeURIComponent(req.headers.get("x-drift-filename") ?? "");
  } catch {
    return fail("The file name could not be read. Try renaming it.", 400);
  }
  const declared = Number(req.headers.get("x-drift-size") ?? NaN);
  const offset = Number(req.headers.get("x-drift-offset") ?? 0);
  const key = req.headers.get("x-drift-transfer") ?? "";

  let opened;
  try {
    opened = await prepareWrite({ dir: stageDir(), key, rawFilename: rawName, size: declared, offset, ttlMs: STAGE_TTL_MS });
  } catch (err) {
    return err instanceof ResumeError ? fail(err.message, err.status) : fail("Couldn't start staging.", 500);
  }

  console.log(`[stage ${key}] receiving "${opened.filename}" (${declared} bytes, from ${offset})`);
  const onBytes = (sessionBytes: number) => noteProgress(stageDir(), key, offset + sessionBytes);

  try {
    await streamToFile(
      Readable.fromWeb(req.body as import("node:stream/web").ReadableStream),
      opened.dest,
      onBytes,
      { append: offset > 0 },
    );
  } catch (err) {
    console.log(`[stage ${key}] stream broke, partial kept:`, err instanceof Error ? err.message : err);
    return fail("The connection broke mid-transfer. What's here is kept — resume to continue.", 500);
  }

  try {
    await commitWrite({ dir: stageDir(), key, filename: opened.filename, size: declared, ttlMs: STAGE_TTL_MS });
  } catch (err) {
    return err instanceof ResumeError ? fail(err.message, err.status) : fail("Couldn't finish staging.", 500);
  }
  return NextResponse.json(
    { stageId: key, pickupPath: `/pickup/${key}`, expiresAt: Date.now() + STAGE_TTL_MS },
    { status: 201 },
  );
}
