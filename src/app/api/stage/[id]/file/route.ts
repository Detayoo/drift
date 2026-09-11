import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getStage, stageDir } from "@/server/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Streams the staged file back as a download. Browsers save it directly. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stage = await getStage(id);
  if (!stage) return NextResponse.json({ error: "That pickup expired or never existed." }, { status: 404 });
  const full = path.join(stageDir(), stage.stored);
  try {
    await fs.access(full);
  } catch {
    return NextResponse.json({ error: "That pickup expired or never existed." }, { status: 404 });
  }
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream<Uint8Array>;
  return new NextResponse(stream, {
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(stage.size),
      "content-disposition": `attachment; filename="${encodeURIComponent(stage.filename)}"`,
    },
  });
}
