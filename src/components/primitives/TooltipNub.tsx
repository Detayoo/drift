import { cn } from "@/lib/utils";

/**
 * The tooltip's tail. Raw SVG lives here and only here: it is bespoke
 * artwork (base width + protrusion + blunt tip tuned as one silhouette
 * with the pill), never a standard UI icon. See the svg-shape-check notes
 * in project-doc for how its numbers were derived.
 */
export function TooltipNub({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 20"
      aria-hidden
      className={cn("app-tooltip-nub pointer-events-none h-5 w-8 select-none", className)}
    >
      <path
        d="M3.7 2 L28.3 2 L21 10 L16 15.5 L11 10 Z"
        fill="var(--tooltip-bg)"
        stroke="var(--tooltip-bg)"
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </svg>
  );
}
