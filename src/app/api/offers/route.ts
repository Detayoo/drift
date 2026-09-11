import { NextRequest, NextResponse } from "next/server";
import { createOffer, decideOffer, listActive } from "@/server/offers";
import { safeName } from "@/server/resumable";
import { verifyOfferAuth } from "@/server/trust";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 ** 3;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Pending + live incoming offers for this device. Polled by the receiver UI. */
export async function GET() {
  return NextResponse.json({
    offers: listActive().map(({ grant: _grant, ...rest }) => rest),
  });
}

/** A remote device offering a file to this device. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    filename?: unknown;
    size?: unknown;
    fromId?: unknown;
    fromName?: unknown;
    nonce?: unknown;
    auth?: unknown;
  } | null;
  if (!body || typeof body.filename !== "string" || !body.filename.trim()) {
    return fail("The offer must name the file.", 400);
  }
  if (typeof body.size !== "number" || !Number.isFinite(body.size) || body.size <= 0) {
    return fail("The offer must declare the file size.", 400);
  }
  if (body.size > MAX_BYTES) {
    return fail("That file is larger than the 5 GB limit.", 413);
  }
  if (typeof body.fromId !== "string" || !body.fromId) {
    return fail("The offer must identify the sender.", 400);
  }
  const verified =
    typeof body.nonce === "string" &&
    body.nonce.length > 0 &&
    typeof body.auth === "string" &&
    body.auth.length > 0 &&
    (await verifyOfferAuth({
      fromId: body.fromId,
      nonce: body.nonce,
      rawFilename: body.filename,
      size: Math.floor(body.size),
      auth: body.auth,
    }));
  const offer = createOffer({
    filename: safeName(body.filename),
    size: Math.floor(body.size),
    fromId: body.fromId,
    fromName: typeof body.fromName === "string" ? body.fromName.slice(0, 40) : "",
    verified,
  });
  if (verified) {
    decideOffer(offer.id, true);
    console.log(`[offer ${offer.id}] auto-accepted (verified pairing)`);
  }
  return NextResponse.json({ id: offer.id, state: offer.state }, { status: 201 });
}
