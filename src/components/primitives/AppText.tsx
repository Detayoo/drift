import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

export type TextVariant =
  | "display"
  | "heading"
  | "section"
  | "subheading"
  | "body"
  | "small"
  | "micro"
  | "mono";

export type TextTone =
  | "default"
  | "secondary"
  | "muted"
  | "faint"
  | "accent"
  | "on-accent"
  | "ok"
  | "err"
  | "warn"
  | "info";

const variantMap: Record<TextVariant, string> = {
  display: "font-display font-semibold tracking-tight text-[clamp(2rem,4.5vw,2.75rem)] leading-[1.08]",
  heading: "font-display font-semibold tracking-tight text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.12]",
  section: "font-display font-medium tracking-tight text-[clamp(1.25rem,2vw,1.5rem)] leading-[1.2]",
  subheading: "font-sans font-medium text-[20px] leading-[1.35]",
  body: "font-sans text-[16px] leading-[1.6]",
  small: "font-sans text-[14px] leading-[1.55]",
  micro: "font-sans text-[13px] leading-[1.5]",
  mono: "font-mono text-[13px] leading-[1.6] tabular-nums",
};

const toneMap: Record<TextTone, string> = {
  default: "text-ink",
  secondary: "text-ink-2",
  muted: "text-ink-3",
  faint: "text-ink-faint",
  accent: "text-accent",
  "on-accent": "text-on-accent",
  ok: "text-ok",
  err: "text-err",
  warn: "text-warn",
  info: "text-info",
};

export type AppTextProps = {
  children?: ReactNode;
  className?: string;
  variant?: TextVariant;
  tone?: TextTone;
  weight?: 400 | 500 | 600 | 700;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  headingLevel?: 1 | 2 | 3;
  id?: string;
  ref?: Ref<HTMLSpanElement | HTMLHeadingElement>;
};

/**
 * The only text element in the system — no raw <p>/<h1>/<span> in features.
 * Display/heading/section variants should pass headingLevel for semantics.
 */
export function AppText({
  children,
  className,
  variant = "body",
  tone = "default",
  weight,
  align,
  truncate = false,
  headingLevel,
  id,
  ref,
}: AppTextProps) {
  const classes = cn(
    variantMap[variant],
    toneMap[tone],
    weight === 400 && "font-normal",
    weight === 500 && "font-medium",
    weight === 600 && "font-semibold",
    weight === 700 && "font-bold",
    align === "center" && "text-center",
    align === "right" && "text-right",
    truncate && "truncate",
    className,
  );
  if (headingLevel === 1) return <h1 ref={ref as Ref<HTMLHeadingElement>} id={id} className={classes}>{children}</h1>;
  if (headingLevel === 2) return <h2 ref={ref as Ref<HTMLHeadingElement>} id={id} className={classes}>{children}</h2>;
  if (headingLevel === 3) return <h3 ref={ref as Ref<HTMLHeadingElement>} id={id} className={classes}>{children}</h3>;
  return <span ref={ref as Ref<HTMLSpanElement>} id={id} className={classes}>{children}</span>;
}
