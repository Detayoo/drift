import { NextRequest, NextResponse } from "next/server";
import { readResumeView } from "@/server/resumable";
import { STAGE_TTL_MS, stageDir } from "@/server/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resume probe for staged uploads. */
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("transferId") ?? "";
  const view = await readResumeView(stageDir(), key, STAGE_TTL_MS);
  if (!view.complete) return NextResponse.json({ received: view.received, complete: null });
  return NextResponse.json({
    received: view.received,
    complete: {
      filename: view.complete.filename,
      bytes: view.complete.size,
      sha256: view.complete.sha256,
      pickupPath: `/pickup/${key}`,
      expiresAt: view.complete.createdAt + STAGE_TTL_MS,
    },
  });
}
