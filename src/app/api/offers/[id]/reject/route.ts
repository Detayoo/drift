import { NextResponse } from "next/server";
import { decideOffer } from "@/server/offers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = decideOffer(id, false);
  if (!offer) return NextResponse.json({ error: "That offer is gone." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
