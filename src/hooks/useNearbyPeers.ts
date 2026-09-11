"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";

export type NearbyPeer = {
  id: string;
  name: string;
  url: string;
};

/**
 * Server peers found by UDP broadcast, polled every 5s. Shared by the
 * radar and the device list so presence is fetched exactly once.
 */
export function useNearbyPeers(deviceId: string, deviceName: string): NearbyPeer[] {
  const [peers, setPeers] = useState<NearbyPeer[]>([]);

  const beat = useCallback(async () => {
    if (!deviceId) return;
    try {
      const body = await fetchJson<{ peers: NearbyPeer[] }>("/api/peers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deviceId, name: deviceName }),
        timeoutMs: 8000,
      });
      setPeers(body.peers);
    } catch {
      return;
    }
  }, [deviceId, deviceName]);

  useEffect(() => {
    void beat();
    const timer = window.setInterval(() => {
      void beat();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [beat]);

  return peers;
}
