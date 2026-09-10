import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives failure reports from client devices (wired in BootProbe).
 * They land in the server log so phone bugs are debuggable from here.
 * Best-effort by design: never throws, never stores.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { message?: unknown; where?: unknown } | null;
  const ua = req.headers.get("user-agent") ?? "?";
  console.log(
    `[client-error] ${String(body?.where ?? "?")} :: ${String(body?.message ?? "?").slice(0, 300)} :: ${ua.slice(0, 120)}`,
  );
  return NextResponse.json({ ok: true });
}
