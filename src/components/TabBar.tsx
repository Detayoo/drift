"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
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
 * Reusable tab capsule. Docked "auto" hangs a vertical rail on the
 * viewport edge on desktop and folds to a horizontal bar on small
 * screens; "right" / "bottom" pin one form everywhere; "none" flows
 * inline (horizontal, collapsing to an icon rail on small screens).
 * The active pill crossfades in place — it never travels through
 * neighboring tabs on its way. Taps ripple outward. Labels follow the labels prop on
 * roomy layouts and hide only where space forbids.
 */
export function TabBar({
  items,
  activeId,
  onChange,
  label,
  labels = "always",
  docked = "none",
  collapseOnMobile = true,
  glassActive = false,
  tipSide = "top",
  className,
}: {
  items: TabBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  labels?: TabBarLabels;
  docked?: TabBarDocked;
  collapseOnMobile?: boolean;
  glassActive?: boolean;
  tipSide?: TooltipSide;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const hasHover = useHasHover();
  const [ripples, setRipples] = useState<Array<{ key: number; tabId: string }>>([]);
  const rail = docked === "right" || docked === "auto";

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
      direction={docked === "none" || docked === "bottom" ? "row" : "col"}
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
        "no-scrollbar border border-line bg-glass-paper backdrop-blur",
        docked === "none" &&
          (collapseOnMobile
            ? "w-fit max-w-full gap-1 overflow-x-auto rounded-full p-1 max-sm:w-fit max-sm:flex-col max-sm:rounded-2xl"
            : "w-fit max-w-full gap-1 overflow-x-auto rounded-full p-1"),
        docked === "right" && "fixed right-5 top-1/2 z-40 w-fit -translate-y-1/2 flex-col gap-1 rounded-2xl p-1.5",
        docked === "bottom" &&
          "w-fit max-w-[calc(100%-2rem)] gap-1 overflow-x-auto rounded-full p-1 fixed bottom-6 left-1/2 z-40 -translate-x-1/2",
        docked === "auto" &&
          "fixed right-5 top-1/2 z-40 w-fit -translate-y-1/2 flex-col gap-1 rounded-2xl p-1.5 max-sm:bottom-6 max-sm:left-1/2 max-sm:right-auto max-sm:top-auto max-sm:w-fit max-sm:max-w-[calc(100%-2rem)] max-sm:-translate-x-1/2 max-sm:translate-y-0 max-sm:flex-row max-sm:justify-evenly max-sm:rounded-full max-sm:p-1.5",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const showLabel = labels === "always" || (labels === "active" && active);
        const tone = !active ? "text-ink-3 hover:text-ink" : glassActive ? "text-paper" : "text-ink";
        const tab = (
          <ActionButton
            key={item.id}
            role="tab"
            aria-selected={active}
            aria-label={item.label}
            onClick={() => select(item.id)}
            className={cn(
              "relative shrink-0 gap-2 overflow-hidden transition-colors",
              showLabel
                ? cn(
                    rail ? "w-full flex-row items-center gap-3 rounded-xl px-3 py-2.5" : "rounded-full px-4 py-2",
                    docked === "auto" &&
                      "max-sm:w-auto max-sm:flex-1 max-sm:justify-center max-sm:rounded-full max-sm:px-2 max-sm:py-2",
                    docked === "none" &&
                      collapseOnMobile &&
                      "max-sm:h-11 max-sm:w-11 max-sm:justify-center max-sm:rounded-full max-sm:p-0",
                  )
                : "h-12 w-12 justify-center rounded-full p-0",
              tone,
            )}
          >
            <AnimatePresence>
              {active && (
                <motion.span
                  key="active-pill"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
                className={cn(
                  "absolute inset-0 overflow-hidden border",
                  glassActive
                    ? "border-white/25 bg-glass-ink backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-110 dark:border-black/30 dark:backdrop-brightness-95"
                    : "border-line bg-raised",
                  showLabel
                    ? cn(
                        rail ? "rounded-xl" : "rounded-full",
                        (docked === "auto" || (docked === "none" && collapseOnMobile)) && "max-sm:rounded-full",
                      )
                    : "rounded-full",
                )}
              >
                {glassActive && (
                  <>
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-linear-to-br from-white/35 via-white/5 to-transparent dark:from-black/25 dark:via-black/5"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-x-4 top-0 h-5 rounded-full bg-linear-to-b from-white/50 to-transparent dark:from-black/25"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-x-4 bottom-0 h-4 rounded-full bg-linear-to-t from-black/25 to-transparent dark:from-white/20"
                    />
                  </>
                )}
              </motion.span>
              )}
            </AnimatePresence>
            <Icon icon={item.icon} size={18} className="relative text-current" />
            {showLabel && (
              <AppText
                variant="small"
                weight={active ? 600 : 500}
                truncate
                className={cn(
                  "relative min-w-0 flex-1 text-left text-current",
                  docked === "none" && collapseOnMobile && "max-sm:hidden",
                )}
              >
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
