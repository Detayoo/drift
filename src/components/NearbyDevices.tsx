"use client";

import { AnimatePresence, motion } from "motion/react";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { StatusDot } from "@/components/Status";
import type { NearbyPeer } from "@/hooks/useNearbyPeers";

/**
 * Server peers found by UDP broadcast. Browser-only phones can't beacon,
 * so they never appear here — they join by scan. Phones included, the
 * list would be a lie; the section copy says so plainly.
 */
export function NearbyDevices({
  peers,
  onSend,
}: {
  peers: NearbyPeer[];
  onSend: (peer: NearbyPeer) => void;
}) {
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
