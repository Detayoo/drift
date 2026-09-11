"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Icon } from "@/components/primitives/Icon";
import type { TablerIcon } from "@tabler/icons-react";

export type TabBarItem = {
  id: string;
  label: string;
  icon: TablerIcon;
};

/**
 * Reusable tab capsule. Horizontal with labels on desktop, collapsing to
 * a vertical icon rail on small screens. The active pill glides between
 * tabs (shared layoutId, one per instance). Glass surface, border
 * elevation, arrow-key navigation included.
 */
export function TabBar({
  items,
  activeId,
  onChange,
  label,
  className,
}: {
  items: TabBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const pill = useId();

  const step = (direction: 1 | -1) => {
    const index = items.findIndex((item) => item.id === activeId);
    const next = items[(index + direction + items.length) % items.length];
    if (next) onChange(next.id);
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
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <ActionButton
            key={item.id}
            role="tab"
            aria-selected={active}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative shrink-0 gap-2 rounded-full px-4 py-2 transition-colors max-sm:rounded-xl max-sm:px-3",
              active ? "text-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={pill}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                className="absolute inset-0 rounded-full border border-line bg-raised max-sm:rounded-xl"
              />
            )}
            <Icon icon={item.icon} size={18} className="relative text-current" />
            <AppText variant="small" weight={active ? 600 : 500} className="relative text-current max-sm:hidden">
              {item.label}
            </AppText>
          </ActionButton>
        );
      })}
    </Box>
  );
}
