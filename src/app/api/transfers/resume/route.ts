import { NextRequest, NextResponse } from "next/server";
import { readResumeView, TRANSFER_PARTIAL_TTL_MS } from "@/server/resumable";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INBOX = path.join(process.cwd(), ".drift-inbox");

/** Resume probe: how much of this transfer is already kept, if anything. */
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("transferId") ?? "";
  const view = await readResumeView(INBOX, key, TRANSFER_PARTIAL_TTL_MS);
  return NextResponse.json(view);
}
