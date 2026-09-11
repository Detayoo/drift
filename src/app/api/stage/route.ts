import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { streamToFile } from "@/server/files";
import { createStage, stageDir, STAGE_TTL_MS } from "@/server/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 ** 3;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeName(raw: string): string {
  const base = path.basename(raw).replace(/[^\w.\-()[\] ]/g, "_").slice(0, 180);
  return base || "file";
}

/**
 * Stages a file on THIS server for pickup by a browser-only device.
 * Same streaming write as transfers; the file waits up to 30 minutes.
 */
export async function POST(req: NextRequest) {
  if (!req.body) return fail("Empty request body. Nothing was sent.", 400);

  const rawName = req.headers.get("x-drift-filename");
  if (!rawName || !rawName.trim()) return fail("Missing file name. The sender must name it.", 400);
  let filename = "";
  try {
    filename = safeName(decodeURIComponent(rawName));
  } catch {
    return fail("The file name could not be read. Try renaming it.", 400);
  }
  if (!filename) filename = "file";

  const declared = Number(req.headers.get("x-drift-size") ?? NaN);
  if (!Number.isFinite(declared) || declared <= 0)
    return fail("Missing file size. The sender must declare it.", 400);
  if (declared > MAX_BYTES) return fail("That file is larger than the 5 GB limit.", 413);

  await fs.mkdir(stageDir(), { recursive: true });
  const id = randomUUID().slice(0, 8);
  const stored = `${id}-${filename}`;
  const dest = path.join(stageDir(), stored);
  console.log(`[stage ${id}] receiving "${filename}" (${declared} bytes)`);

  try {
    await streamToFile(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), dest);
  } catch (err) {
    await fs.rm(dest, { force: true });
    console.log(`[stage ${id}] stream failed:`, err instanceof Error ? err.message : err);
    return fail("The connection broke mid-transfer. Nothing was kept.", 500);
  }

  const stat = await fs.stat(dest);
  if (stat.size !== declared) {
    await fs.rm(dest, { force: true });
    return fail(`Only ${stat.size} of ${declared} bytes arrived. Nothing was kept.`, 422);
  }

  const created = await createStage({ id, filename, size: stat.size, stored });
  return NextResponse.json(
    { stageId: id, pickupPath: `/pickup/${id}`, expiresAt: created.createdAt + STAGE_TTL_MS },
    { status: 201 },
  );
}
