import { NextResponse } from "next/server";
import { removeTrusted } from "@/server/trust";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await removeTrusted(id))) {
    return NextResponse.json({ error: "That device isn't trusted." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
