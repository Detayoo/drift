import { randomUUID } from "node:crypto";

export type OfferState =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "sending"
  | "done"
  | "failed";

export type Offer = {
  id: string;
  filename: string;
  size: number;
  fromId: string;
  fromName: string;
  state: OfferState;
  grant: string | null;
  verified: boolean;
  received: number;
  total: number;
  createdAt: number;
};

const offers = new Map<string, Offer>();
const PENDING_TTL = 2 * 60 * 1000;
const GRANT_TTL = 10 * 60 * 1000;

function sweep(now: number) {
  for (const offer of offers.values()) {
    if (offer.state === "pending" && now - offer.createdAt > PENDING_TTL) {
      offer.state = "expired";
    }
    if ((offer.state === "accepted" || offer.state === "sending") && now - offer.createdAt > GRANT_TTL) {
      offer.state = "expired";
    }
    if (offer.state !== "pending" && offer.state !== "accepted" && offer.state !== "sending") {
      if (now - offer.createdAt > GRANT_TTL) offers.delete(offer.id);
    }
  }
}

export function createOffer(input: {
  filename: string;
  size: number;
  fromId: string;
  fromName: string;
  verified?: boolean;
}): Offer {
  sweep(Date.now());
  const offer: Offer = {
    id: randomUUID().slice(0, 8),
    grant: null,
    verified: input.verified ?? false,
    received: 0,
    total: input.size,
    state: "pending",
    createdAt: Date.now(),
    ...input,
  };
  offers.set(offer.id, offer);
  console.log(`[offer ${offer.id}] "${offer.filename}" (${offer.size} bytes) from ${offer.fromName || offer.fromId}`);
  return offer;
}

export function getOffer(id: string): Offer | undefined {
  sweep(Date.now());
  return offers.get(id);
}

export function listActive(): Offer[] {
  sweep(Date.now());
  return [...offers.values()]
    .filter((o) => o.state === "pending" || o.state === "accepted" || o.state === "sending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function decideOffer(id: string, accept: boolean): Offer | undefined {
  sweep(Date.now());
  const offer = offers.get(id);
  if (!offer || offer.state !== "pending") return undefined;
  offer.state = accept ? "accepted" : "rejected";
  if (accept) {
    offer.grant = randomUUID();
    console.log(`[offer ${id}] accepted, grant issued`);
  } else {
    console.log(`[offer ${id}] rejected`);
  }
  return offer;
}

export function consumeGrant(grant: string): Offer | undefined {
  sweep(Date.now());
  for (const offer of offers.values()) {
    // A grant stays valid while its transfer is live, so a client retry
    // after a broken stream doesn't need a second accept. Done offers
    // never match, so each approval still completes at most once.
    if (offer.grant === grant && (offer.state === "accepted" || offer.state === "sending" || offer.state === "failed")) {
      offer.state = "sending";
      console.log(`[offer ${offer.id}] upload started`);
      return offer;
    }
  }
  return undefined;
}

export function markProgress(id: string, received: number, total: number) {
  const offer = offers.get(id);
  if (offer && offer.state === "sending") {
    offer.received = received;
    offer.total = total;
  }
}

export function finishOffer(id: string, ok: boolean) {
  const offer = offers.get(id);
  if (offer && offer.state === "sending") {
    offer.state = ok ? "done" : "failed";
    console.log(`[offer ${id}] ${ok ? "completed" : "failed"}`);
  }
}
