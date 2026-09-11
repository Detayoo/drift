"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TooltipNub } from "@/components/primitives/TooltipNub";

export type TooltipSide = "top" | "right" | "bottom" | "left";

/**
 * Dark tooltip pill with a blended tail. Radix owns positioning, flipping,
 * collision and keyboard focus; this only skins it.
 *
 * Two trigger kinds, never mixed: info triggers (explain only) may pass
 * tapToOpen so touch users can tap to read; action triggers (buttons that
 * do something) must NOT — the first tap would be swallowed. For actions,
 * gate the whole tooltip on useHasHover instead (see IconButton).
 */
export function AppTooltip({
  content,
  side = "top",
  align = "center",
  variant = "default",
  tapToOpen = false,
  children,
}: {
  content: ReactNode;
  side?: TooltipSide;
  align?: "start" | "center" | "end";
  variant?: "default" | "large";
  tapToOpen?: boolean;
  children: ReactNode;
}) {
  const isTouch = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches,
    [],
  );
  const [manualOpen, setManualOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const touchMode = tapToOpen && isTouch;

  useEffect(() => {
    if (!touchMode || !manualOpen) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setManualOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [touchMode, manualOpen]);

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root
        open={touchMode ? manualOpen : undefined}
        onOpenChange={(next) => {
          if (touchMode) setManualOpen(next);
        }}
      >
        <TooltipPrimitive.Trigger asChild>
          {touchMode ? (
            <span
              ref={rootRef}
              className="inline-flex"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setManualOpen((v) => !v);
              }}
              onClick={(e) => e.preventDefault()}
            >
              {children}
            </span>
          ) : (
            children
          )}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={12}
            collisionPadding={8}
            className={cn(
              "tooltip-pill z-[100] flex items-center gap-2 rounded-sm border border-line bg-tooltip-bg px-3 py-1.5 text-[13px] font-normal text-tooltip-fg",
              variant === "large" &&
                "max-w-[min(300px,calc(100vw-2rem))] items-start px-4 py-3 text-left leading-snug",
            )}
          >
            <span className={cn("select-text", variant === "large" ? "flex-1" : "whitespace-nowrap")}>
              {content}
            </span>
            <TooltipNub />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
