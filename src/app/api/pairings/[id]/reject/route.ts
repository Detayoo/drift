import { NextResponse } from "next/server";
import { decidePairing } from "@/server/pairing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pairing = await decidePairing(id, false);
  if (!pairing) return NextResponse.json({ error: "That pairing request is gone." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
