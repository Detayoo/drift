import { IconLoader2 } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText, type TextVariant } from "@/components/primitives/AppText";
import { Icon } from "@/components/primitives/Icon";
import type { TablerIcon } from "@tabler/icons-react";

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const toneMap: Record<ButtonTone, string> = {
  primary: "bg-ink text-paper border border-ink hover:opacity-85",
  secondary: "bg-raised text-ink border border-line hover:bg-hover",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:bg-hover hover:text-ink",
  danger: "bg-err-bg text-err border border-err hover:opacity-85",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5",
  md: "h-12 px-6",
  lg: "h-[52px] px-8",
};

const labelVariant: Record<ButtonSize, TextVariant> = {
  sm: "micro",
  md: "small",
  lg: "body",
};

export type AppButtonProps = {
  children?: ReactNode;
  className?: string;
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: TablerIcon;
  iconRight?: TablerIcon;
  label: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

/** Canonical button. Rounded-md, press scale, loading blur — no shadows. */
export function AppButton({
  children,
  className,
  tone = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  label,
  type = "button",
  onClick,
}: AppButtonProps) {
  return (
    <ActionButton
      type={type}
      aria-label={label}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "relative gap-2 overflow-hidden rounded-md font-medium transition-opacity",
        toneMap[tone],
        sizeMap[size],
        className,
      )}
    >
      {loading && (
        <Icon icon={IconLoader2} size={16} className="animate-spin text-current" />
      )}
      {iconLeft && !loading && <Icon icon={iconLeft} size={16} className="text-current" />}
      <AppText variant={labelVariant[size]} weight={500} truncate className={cn("text-current", loading && "opacity-0")}>
        {children}
      </AppText>
      {iconRight && !loading && <Icon icon={iconRight} size={16} className="text-current" />}
    </ActionButton>
  );
}
