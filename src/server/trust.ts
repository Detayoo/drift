import { createHmac, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type TrustedDevice = {
  id: string;
  name: string;
  secret: string;
  addedAt: number;
  nonces: string[];
};

type Store = { devices: TrustedDevice[] };

const FILE = path.join(process.cwd(), ".drift-trust.json");
const MAX_NONCES = 200;

async function load(): Promise<Store> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as Store;
    if (!parsed || !Array.isArray(parsed.devices)) return { devices: [] };
    return parsed;
  } catch {
    return { devices: [] };
  }
}

async function save(store: Store): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(store));
}

/** Public listing — secrets never leave this module. */
export async function listTrusted(): Promise<Array<{ id: string; name: string; addedAt: number }>> {
  const store = await load();
  return store.devices.map(({ id, name, addedAt }) => ({ id, name, addedAt }));
}

export async function addTrusted(input: { id: string; name: string; secret: string }): Promise<void> {
  if (!input.id || !/^[0-9a-f]{32,128}$/i.test(input.secret)) {
    throw new Error("Bad trust record.");
  }
  const store = await load();
  const existing = store.devices.find((d) => d.id === input.id);
  if (existing) {
    existing.name = input.name.slice(0, 40);
    existing.secret = input.secret;
  } else {
    store.devices.push({
      id: input.id,
      name: input.name.slice(0, 40),
      secret: input.secret,
      addedAt: Date.now(),
      nonces: [],
    });
  }
  await save(store);
}

export async function removeTrusted(id: string): Promise<boolean> {
  const store = await load();
  const next = store.devices.filter((d) => d.id !== id);
  if (next.length === store.devices.length) return false;
  await save({ devices: next });
  return true;
}

export async function isTrusted(id: string): Promise<boolean> {
  const store = await load();
  return store.devices.some((d) => d.id === id);
}

/**
 * Verifies an offer's HMAC against the stored secret and rejects replays.
 * True means the holder of the paired secret made this exact offer —
 * safe to auto-accept. Anything else stays manual.
 */
export async function verifyOfferAuth(input: {
  fromId: string;
  nonce: string;
  rawFilename: string;
  size: number;
  auth: string;
}): Promise<boolean> {
  if (!input.nonce || !input.auth) return false;
  const store = await load();
  const device = store.devices.find((d) => d.id === input.fromId);
  if (!device || device.nonces.includes(input.nonce)) return false;
  let ok = false;
  try {
    const mac = createHmac("sha256", Buffer.from(device.secret, "hex"))
      .update(`${input.nonce}.${input.rawFilename}.${input.size}`)
      .digest();
    const given = Buffer.from(input.auth, "hex");
    ok = mac.length === given.length && timingSafeEqual(mac, given);
  } catch {
    ok = false;
  }
  if (!ok) return false;
  device.nonces.push(input.nonce);
  if (device.nonces.length > MAX_NONCES) {
    device.nonces.splice(0, device.nonces.length - MAX_NONCES);
  }
  await save(store).catch(() => null);
  return true;
}
