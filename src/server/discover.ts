import dgram from "node:dgram";

export type Peer = {
  id: string;
  name: string;
  url: string;
  lastSeen: number;
};

const BEACON_PORT = 48721;
const BEACON_MS = 3000;
const PEER_TTL = 10000;

let socket: dgram.Socket | null = null;
let self = { id: "", name: "", httpPort: "3000" };
let selfIdentity: { id: string; name: string } | null = null;
const peers = new Map<string, Peer>();

function sweep(now: number) {
  for (const [id, peer] of peers) {
    if (now - peer.lastSeen > PEER_TTL) peers.delete(id);
  }
}

/**
 * UDP broadcast discovery between Drift servers. Zero dependencies:
 * mDNS was rejected (extra dep, and it can't help browser-only phones
 * anyway). Beacons are the heartbeat; silence is disappearance.
 */
export function registerDevice(identity: { id: string; name: string; httpPort: string }): Peer[] {
  self = { ...identity, name: identity.name.slice(0, 40) };
  if (self.id) selfIdentity = { id: self.id, name: self.name };

  if (!socket) {
    socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    socket.on("message", (msg, info) => {
      try {
        const beacon = JSON.parse(msg.toString()) as {
          type?: string;
          id?: string;
          name?: string;
          httpPort?: string;
        };
        if (beacon?.type !== "drift-hello" || !beacon.id || beacon.id === self.id) return;
        peers.set(beacon.id, {
          id: beacon.id,
          name: (beacon.name || "Unnamed").slice(0, 40),
          url: `http://${info.address}:${beacon.httpPort ?? "3000"}`,
          lastSeen: Date.now(),
        });
      } catch {
        return;
      }
    });
    socket.bind(BEACON_PORT, () => {
      socket?.setBroadcast(true);
      const beat = () => {
        const payload = Buffer.from(
          JSON.stringify({ type: "drift-hello", id: self.id, name: self.name, httpPort: self.httpPort }),
        );
        socket?.send(payload, BEACON_PORT, "255.255.255.255");
      };
      beat();
      setInterval(beat, BEACON_MS).unref?.();
    });
  }

  sweep(Date.now());
  return [...peers.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** This server's device identity, as last reported by its browser. */
export function getSelfIdentity(): { id: string; name: string } | null {
  return selfIdentity;
}
