import { NextResponse } from "next/server";
import { getPairing } from "@/server/pairing";
import { getSelfIdentity } from "@/server/discover";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pairing state for the initiator's poll loop, plus our identity once known. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pairing = getPairing(id);
  if (!pairing) return NextResponse.json({ error: "Unknown or expired pairing." }, { status: 404 });
  const self = getSelfIdentity();
  return NextResponse.json({
    state: pairing.state,
    code: pairing.code,
    deviceId: self?.id ?? null,
    deviceName: self?.name ?? null,
  });
}
