import { NextRequest, NextResponse } from "next/server";
import { createPairing } from "@/server/pairing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** A remote device asking to pair with this one. Returns the shared code. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    fromId?: unknown;
    fromName?: unknown;
    secret?: unknown;
    nonceA?: unknown;
  } | null;
  if (!body || typeof body.fromId !== "string" || !body.fromId) {
    return fail("The request must identify the device.", 400);
  }
  if (typeof body.secret !== "string" || !/^[0-9a-f]{64}$/i.test(body.secret)) {
    return fail("The request must carry a valid secret.", 400);
  }
  if (typeof body.nonceA !== "string" || !body.nonceA || body.nonceA.length > 128) {
    return fail("The request must carry a nonce.", 400);
  }
  const pairing = createPairing({
    fromId: body.fromId,
    fromName: typeof body.fromName === "string" ? body.fromName.slice(0, 40) : "",
    secret: body.secret.toLowerCase(),
    nonceA: body.nonceA,
  });
  return NextResponse.json({ pairId: pairing.id, nonceB: pairing.nonceB, code: pairing.code }, { status: 201 });
}
