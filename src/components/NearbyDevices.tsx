"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { StatusDot } from "@/components/Status";
import { fetchJson } from "@/lib/http";

export type NearbyPeer = {
  id: string;
  name: string;
  url: string;
};

/**
 * Server peers found by UDP broadcast. Browser-only phones can't beacon,
 * so they never appear here — they join by scan. Phones included, list
 * would be a lie; the copy below says so plainly.
 */
export function NearbyDevices({
  deviceId,
  deviceName,
  onSend,
}: {
  deviceId: string;
  deviceName: string;
  onSend: (peer: NearbyPeer) => void;
}) {
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

  return (
    <Box gap="xs" aria-live="polite" label="Nearby devices">
      <AnimatePresence initial={false}>
        {peers.map((peer) => (
          <motion.div
            key={peer.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Box
              direction="row"
              align="center"
              gap="sm"
              tint="raised"
              bordered
              border="line"
              radius="md"
              className="px-3.5 py-2.5"
            >
              <StatusDot tone="accent" pulse />
              <Box className="min-w-0 flex-1">
                <AppText variant="small" weight={600} truncate>{peer.name || "Unnamed device"}</AppText>
                <AppText variant="mono" tone="faint" truncate>{peer.url}</AppText>
              </Box>
              <AppButton label={`Send to ${peer.name || "device"}`} tone="secondary" size="sm" onClick={() => onSend(peer)}>
                Send
              </AppButton>
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
}
