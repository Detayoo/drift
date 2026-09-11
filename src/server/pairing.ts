import { createHash, randomUUID } from "node:crypto";
import { addTrusted } from "@/server/trust";

export type PairingState = "pending" | "confirmed" | "declined" | "expired";

export type Pairing = {
  id: string;
  fromId: string;
  fromName: string;
  secret: string;
  nonceA: string;
  nonceB: string;
  code: string;
  createdAt: number;
  state: PairingState;
};

const pairs = new Map<string, Pairing>();
const PAIR_TTL = 5 * 60 * 1000;

/**
 * Short authentication string both screens display. Same nonces in,
 * same code out — a mismatch means someone is in the middle.
 */
export function pairingCode(nonceA: string, nonceB: string): string {
  const n = createHash("sha256").update(`${nonceA}.${nonceB}`).digest().readUInt32BE(0) % 1000000;
  return `${String(Math.floor(n / 1000)).padStart(3, "0")} ${String(n % 1000).padStart(3, "0")}`;
}

function sweep(now: number) {
  for (const [id, pair] of pairs) {
    if (pair.state === "pending" && now - pair.createdAt > PAIR_TTL) pair.state = "expired";
    if (pair.state !== "pending" && now - pair.createdAt > PAIR_TTL) pairs.delete(id);
  }
}

export function createPairing(input: {
  fromId: string;
  fromName: string;
  secret: string;
  nonceA: string;
}): Pairing {
  sweep(Date.now());
  const nonceB = randomUUID();
  const pairing: Pairing = {
    id: randomUUID().slice(0, 8),
    state: "pending",
    createdAt: Date.now(),
    nonceB,
    code: pairingCode(input.nonceA, nonceB),
    ...input,
  };
  pairs.set(pairing.id, pairing);
  console.log(`[pair ${pairing.id}] request from ${pairing.fromName || pairing.fromId}`);
  return pairing;
}

export function getPairing(id: string): Pairing | undefined {
  sweep(Date.now());
  return pairs.get(id);
}

export function listPendingPairings(): Pairing[] {
  sweep(Date.now());
  return [...pairs.values()].filter((p) => p.state === "pending").sort((a, b) => a.createdAt - b.createdAt);
}

export async function decidePairing(id: string, accept: boolean): Promise<Pairing | undefined> {
  sweep(Date.now());
  const pairing = pairs.get(id);
  if (!pairing || pairing.state !== "pending") return undefined;
  pairing.state = accept ? "confirmed" : "declined";
  if (accept) {
    await addTrusted({ id: pairing.fromId, name: pairing.fromName, secret: pairing.secret });
    console.log(`[pair ${id}] confirmed — ${pairing.fromName || pairing.fromId} trusted`);
  } else {
    console.log(`[pair ${id}] declined`);
  }
  return pairing;
}
