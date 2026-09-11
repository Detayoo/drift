"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { AppTooltip, type TooltipSide } from "@/components/AppTooltip";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Icon } from "@/components/primitives/Icon";
import { useHasHover } from "@/hooks/useHasHover";
import type { TablerIcon } from "@tabler/icons-react";

export type TabBarItem = {
  id: string;
  label: string;
  icon: TablerIcon;
};

export type TabBarLabels = "always" | "active" | "never";
export type TabBarDocked = "none" | "bottom" | "right" | "auto";

/**
 * Reusable tab capsule. Horizontal with labels on desktop, collapsing to
 * a circular-icon rail on small screens. The active pill glides between
 * tabs (shared layoutId, one per instance); taps ripple outward.
 *
 * - labels: "always" (default) shows every label, "active" only the
 *   selected tab's, "never" icons alone. The small-screen rail is always
 *   icon-only — there is no room for words there.
 * - docked: "none" flows inline; "bottom" pins a floating bar to the
 *   viewport bottom; "right" pins a rail to the viewport edge;
 *   "auto" does bottom on desktop, right rail on mobile.
 */
export function TabBar({
  items,
  activeId,
  onChange,
  label,
  labels = "always",
  docked = "none",
  tipSide = "top",
  className,
}: {
  items: TabBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  labels?: TabBarLabels;
  docked?: TabBarDocked;
  tipSide?: TooltipSide;
  className?: string;
}) {
  const pill = useId();
  const reduceMotion = useReducedMotion();
  const hasHover = useHasHover();
  const [ripples, setRipples] = useState<Array<{ key: number; tabId: string }>>([]);

  const select = (id: string) => {
    onChange(id);
    if (reduceMotion) return;
    const key = Date.now() + Math.random();
    setRipples((prev) => [...prev.slice(-2), { key, tabId: id }]);
  };

  const step = (direction: 1 | -1) => {
    const index = items.findIndex((item) => item.id === activeId);
    const next = items[(index + direction + items.length) % items.length];
    if (next) select(next.id);
  };

  return (
    <Box
      role="tablist"
      label={label}
      direction="row"
      align="center"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          step(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          step(-1);
        }
      }}
      className={cn(
        "no-scrollbar w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-paper/85 p-1 backdrop-blur",
        "max-sm:w-fit max-sm:flex-col max-sm:rounded-2xl",
        docked === "bottom" && "fixed bottom-6 left-1/2 z-40 -translate-x-1/2",
        docked === "right" && "fixed right-5 top-1/2 z-40 -translate-y-1/2 flex-col rounded-2xl",
        docked === "auto" &&
          "fixed bottom-6 left-1/2 z-40 -translate-x-1/2 max-sm:bottom-auto max-sm:left-auto max-sm:right-4 max-sm:top-1/2 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:flex-col max-sm:rounded-2xl",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const showLabel = labels === "always" || (labels === "active" && active);
        const tab = (
          <ActionButton
            key={item.id}
            role="tab"
            aria-selected={active}
            aria-label={item.label}
            onClick={() => select(item.id)}
            className={cn(
              "relative shrink-0 gap-2 overflow-hidden rounded-full px-4 py-2 transition-colors",
              "max-sm:h-11 max-sm:w-11 max-sm:justify-center max-sm:rounded-full max-sm:p-0",
              active ? "text-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={pill}
                transition={
                  reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }
                }
                className="absolute inset-0 rounded-full border border-line bg-raised max-sm:rounded-full"
              />
            )}
            <Icon icon={item.icon} size={18} className="relative text-current" />
            {showLabel && (
              <AppText variant="small" weight={active ? 600 : 500} className="relative text-current max-sm:hidden">
                {item.label}
              </AppText>
            )}
            <AnimatePresence>
              {ripples
                .filter((ripple) => ripple.tabId === item.id)
                .map((ripple) => (
                  <motion.span
                    key={ripple.key}
                    initial={{ scale: 0.2, opacity: 0.7 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    onAnimationComplete={() => {
                      setRipples((prev) => prev.filter((r) => r.key !== ripple.key));
                    }}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent"
                  />
                ))}
            </AnimatePresence>
          </ActionButton>
        );
        if (showLabel || !hasHover) return tab;
        return (
          <AppTooltip key={item.id} content={item.label} side={tipSide}>
            {tab}
          </AppTooltip>
        );
      })}
    </Box>
  );
}
