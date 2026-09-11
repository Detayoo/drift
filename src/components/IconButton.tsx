"use client";

import { cn } from "@/lib/utils";
import { AppTooltip, type TooltipSide } from "@/components/AppTooltip";
import { ActionButton } from "@/components/primitives/ActionButton";
import { Icon } from "@/components/primitives/Icon";
import { useHasHover } from "@/hooks/useHasHover";
import type { ReactNode, Ref } from "react";
import type { TablerIcon } from "@tabler/icons-react";

/**
 * Canonical icon action. Rounded-md; rounded-full only for overflow "more".
 * The label is the aria-label; on hover-capable devices it also shows as a
 * tooltip. Touch devices get neither (nothing to hover) — the action stays
 * fully usable, since meaning never lives in the tooltip alone.
 */
export function IconButton({
  icon,
  label,
  tip,
  tipSide = "top",
  onClick,
  className,
  size = 18,
  circular = false,
  disabled = false,
  ref,
}: {
  icon: TablerIcon;
  label: string;
  tip?: ReactNode;
  tipSide?: TooltipSide;
  onClick?: () => void;
  className?: string;
  size?: number;
  circular?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  const hasHover = useHasHover();
  const button = (
    <ActionButton
      ref={ref}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-10 w-10 border border-line bg-raised text-ink transition-colors hover:bg-hover",
        circular ? "rounded-full" : "rounded-md",
        className,
      )}
    >
      <Icon icon={icon} size={size} className="text-current" />
    </ActionButton>
  );
  if (!hasHover) return button;
  return (
    <AppTooltip content={tip ?? label} side={tipSide}>
      {button}
    </AppTooltip>
  );
}
