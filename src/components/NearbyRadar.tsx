"use client";

import { IconRadar } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Icon } from "@/components/primitives/Icon";
import type { NearbyPeer } from "@/hooks/useNearbyPeers";

function blipPosition(id: string, index: number): { x: number; y: number } {
  let hash = index * 31 + 7;
  for (const ch of id) hash = (hash * 33 + ch.charCodeAt(0)) % 360;
  const angle = (hash * Math.PI) / 180;
  const radius = 30 + (hash % 9);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/**
 * The living face of discovery: sonar rings breathing outward while
 * peers pop in as blips with a live count. Positions derive from the
 * peer id, so server and client paint the same picture with no flash.
 */
export function NearbyRadar({ peers }: { peers: NearbyPeer[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <Box
      radius="lg"
      bordered
      border="line"
      tint="raised"
      className="relative flex h-[300px] items-center justify-center overflow-hidden max-sm:h-[260px]"
    >
      {[0, 1, 2].map((ring) =>
        reduceMotion ? (
          <Box
            key={ring}
            radius="full"
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 border border-ink opacity-20"
          />
        ) : (
          <motion.span
            key={ring}
            initial={{ scale: 0.35, opacity: 0.55 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, delay: ring * 0.85, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink"
          />
        ),
      )}
      <AnimatePresence>
        {peers.map((peer, index) => {
          const pos = blipPosition(peer.id, index);
          return (
            <motion.span
              key={peer.id}
              title={peer.name || "Unnamed device"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              style={{ left: `calc(50% + ${pos.x}%)`, top: `calc(50% + ${pos.y}%)` }}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
            />
          );
        })}
      </AnimatePresence>
      <Box gap="xs" align="center" className="relative">
        <Box align="center" justify="center" radius="full" className="h-16 w-16 bg-ink">
          <Icon icon={IconRadar} size={26} className="text-paper" />
        </Box>
        <Box role="status" label="Nearby device count">
          <AppText variant="mono" tone="secondary">
            {peers.length === 0 ? "scanning…" : `${peers.length} nearby`}
          </AppText>
        </Box>
      </Box>
    </Box>
  );
}
