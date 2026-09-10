import { NextRequest, NextResponse } from "next/server";
import { networkInterfaces } from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type NetworkInfo = {
  port: string;
  urls: string[];
};

/** The LAN addresses this server is reachable on, as seen by other devices. */
export async function GET(req: NextRequest) {
  const port = new URL(req.url).port || "3000";
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface?.family === "IPv4" && !iface.internal)
    .map((iface) => (iface as { address: string }).address);
  const urls = [...new Set(ips)].map((ip) => `http://${ip}:${port}`);
  return NextResponse.json({ port, urls } satisfies NetworkInfo);
}
