import type { TablerIcon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const ICON_SIZES = [14, 16, 18, 20, 24, 32] as const;

/**
 * The only icon renderer. Tabler only — never Lucide, never raw <svg>.
 * Icons inherit tone via currentColor; default is primary ink.
 */
export function Icon({
  icon: TablerIcon,
  size = 18,
  stroke = 1.75,
  className,
  label,
}: {
  icon: TablerIcon;
  size?: (typeof ICON_SIZES)[number] | number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  return (
    <TablerIcon
      size={size}
      stroke={stroke}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("shrink-0 text-ink", className)}
    />
  );
}
