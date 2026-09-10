import { NextResponse } from "next/server";
import { deleteStage } from "@/server/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Removes a staged pickup (sender cancel / cleanup). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await deleteStage(id))) {
    return NextResponse.json({ error: "That pickup is already gone." }, { status: 404 });
  }
  console.log(`[stage ${id}] deleted by sender`);
  return NextResponse.json({ ok: true });
}
