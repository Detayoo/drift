import { sha256 } from "js-sha256";

export type PairedPeer = {
  deviceId: string;
  name: string;
  secret: string;
};

const STORE_KEY = "drift-paired";

/**
 * Client pairing crypto. js-sha256 (not WebCrypto) because plain-http LAN
 * is not a secure context and subtle is undefined there — one code path
 * on every browser, identical digests to node:crypto server-side.
 */
export function pairingCode(nonceA: string, nonceB: string): string {
  const digest = sha256.array(`${nonceA}.${nonceB}`);
  const n = ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>> 0;
  const code = n % 1000000;
  return `${String(Math.floor(code / 1000)).padStart(3, "0")} ${String(code % 1000).padStart(3, "0")}`;
}

export function offerAuth(secretHex: string, nonce: string, rawFilename: string, size: number): string {
  const key = new Uint8Array((secretHex.match(/../g) ?? []).map((b) => parseInt(b, 16)));
  return sha256.hmac(key, `${nonce}.${rawFilename}.${size}`);
}

export function newSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readStore(): Record<string, PairedPeer> {
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "{}") as Record<string, PairedPeer>;
  } catch {
    return {};
  }
}

/** The secret for a destination origin, if this browser ever paired with it. */
export function pairedForOrigin(origin: string): PairedPeer | null {
  return readStore()[origin] ?? null;
}

export function savePaired(origin: string, peer: PairedPeer): void {
  const store = readStore();
  store[origin] = peer;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    return;
  }
}
