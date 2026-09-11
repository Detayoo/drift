import { NextResponse } from "next/server";
import { addTrusted, listTrusted } from "@/server/trust";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Trusted devices. Secrets never leave the server. */
export async function GET() {
  return NextResponse.json({ devices: await listTrusted() });
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Records trust this browser arranged (a pairing it initiated). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    id?: unknown;
    name?: unknown;
    secret?: unknown;
  } | null;
  if (!body || typeof body.id !== "string" || !body.id) {
    return fail("Trust needs a device id.", 400);
  }
  if (typeof body.secret !== "string" || !/^[0-9a-f]{32,128}$/i.test(body.secret)) {
    return fail("Trust needs a valid secret.", 400);
  }
  try {
    await addTrusted({
      id: body.id,
      name: typeof body.name === "string" ? body.name : "",
      secret: body.secret.toLowerCase(),
    });
  } catch {
    return fail("Couldn't record trust.", 400);
  }
  return NextResponse.json({ ok: true });
}
