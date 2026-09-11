import { NextResponse } from "next/server";
import { listPendingPairings } from "@/server/pairing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Incoming pairing requests for this device. Polled by its browser. */
export async function GET() {
  return NextResponse.json({
    pairings: listPendingPairings().map(({ id, fromId, fromName, code, createdAt }) => ({
      id,
      fromId,
      fromName,
      code,
      createdAt,
    })),
  });
}
