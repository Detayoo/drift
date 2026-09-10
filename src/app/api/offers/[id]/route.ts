import { NextResponse } from "next/server";
import { getOffer } from "@/server/offers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Offer state for the sender's poll loop. The grant appears only once accepted. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = getOffer(id);
  if (!offer) return NextResponse.json({ error: "Unknown or expired offer." }, { status: 404 });
  return NextResponse.json({
    state: offer.state,
    ...(offer.state === "accepted" && offer.grant ? { grant: offer.grant } : {}),
  });
}
