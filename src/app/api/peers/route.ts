import { NextRequest, NextResponse } from "next/server";
import { registerDevice } from "@/server/discover";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Presence registry. The browser owns identity, so every poll re-registers
 * (name edits propagate, nothing goes stale). Returns live server peers.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: unknown; name?: unknown } | null;
  if (!body || typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Presence needs a device id." }, { status: 400 });
  }
  const port = new URL(req.url).port || "3000";
  const peers = registerDevice({
    id: body.id,
    name: typeof body.name === "string" ? body.name : "",
    httpPort: port,
  });
  return NextResponse.json({ peers });
}
