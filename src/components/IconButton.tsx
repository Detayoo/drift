import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/primitives/ActionButton";
import { Icon } from "@/components/primitives/Icon";
import type { Ref } from "react";
import type { TablerIcon } from "@tabler/icons-react";

/**
 * Canonical icon action. Rounded-md; rounded-full only for overflow "more".
 * The label is the aria-label and the hover title — never icon-only mystery.
 */
export function IconButton({
  icon,
  label,
  onClick,
  className,
  size = 18,
  circular = false,
  disabled = false,
  ref,
}: {
  icon: TablerIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  size?: number;
  circular?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
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
}
