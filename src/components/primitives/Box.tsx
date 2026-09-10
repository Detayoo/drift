import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";
type Pad = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type Tint =
  | "none"
  | "paper"
  | "raised"
  | "sunken"
  | "hover"
  | "accent"
  | "ok-bg"
  | "err-bg"
  | "warn-bg"
  | "info-bg";
type Border = "none" | "line" | "soft" | "field";
type Radius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const padMap: Record<Pad, string> = {
  none: "",
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

const gapMap: Record<Gap, string> = {
  none: "",
  xs: "gap-1.5",
  sm: "gap-2.5",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const tintMap: Record<Tint, string> = {
  none: "",
  paper: "bg-paper",
  raised: "bg-raised",
  sunken: "bg-sunken",
  hover: "bg-hover",
  accent: "bg-accent",
  "ok-bg": "bg-ok-bg",
  "err-bg": "bg-err-bg",
  "warn-bg": "bg-warn-bg",
  "info-bg": "bg-info-bg",
};

const borderMap: Record<Border, string> = {
  none: "border-transparent",
  line: "border-line",
  soft: "border-line-soft",
  field: "border-field",
};

const radiusMap: Record<Radius, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export type BoxProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: string;
  label?: string;
  pad?: Pad;
  gap?: Gap;
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  tint?: Tint;
  border?: Border;
  bordered?: boolean;
  radius?: Radius;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onHover?: () => void;
};

/** The only <div> in the system. Every rectangle is a Box with props. */
export function Box({
  children,
  className,
  style,
  id,
  role,
  label,
  pad = "none",
  gap = "none",
  direction,
  align,
  justify,
  wrap = false,
  tint = "none",
  border = "none",
  bordered = false,
  radius = "none",
  onClick,
  onHover,
}: BoxProps) {
  const flex = direction ?? (gap !== "none" || align || justify ? "col" : undefined);
  return (
    <div
      id={id}
      role={role}
      aria-label={label}
      style={style}
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        flex === "row" && "flex flex-row",
        flex === "col" && "flex flex-col",
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        align === "baseline" && "items-baseline",
        justify === "start" && "justify-start",
        justify === "center" && "justify-center",
        justify === "end" && "justify-end",
        justify === "between" && "justify-between",
        justify === "around" && "justify-around",
        justify === "evenly" && "justify-evenly",
        wrap && "flex-wrap",
        padMap[pad],
        gapMap[gap],
        tintMap[tint],
        bordered && "border",
        bordered && borderMap[border],
        radiusMap[radius],
        className,
      )}
    >
      {children}
    </div>
  );
}
