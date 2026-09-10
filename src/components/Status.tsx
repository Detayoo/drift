import { cn } from "@/lib/utils";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";

export type StatusTone = "ok" | "err" | "warn" | "info" | "neutral" | "accent";

const dotMap: Record<StatusTone, string> = {
  ok: "bg-ok",
  err: "bg-err",
  warn: "bg-warn",
  info: "bg-info",
  neutral: "bg-ink-faint",
  accent: "bg-accent",
};

const badgeMap: Record<StatusTone, string> = {
  ok: "bg-ok-bg text-ok border-ok",
  err: "bg-err-bg text-err border-err",
  warn: "bg-warn-bg text-warn border-warn",
  info: "bg-info-bg text-info border-info",
  neutral: "bg-sunken text-ink-2 border-line",
  accent: "bg-accent text-on-accent border-accent",
};

/** 8px status dot. Rounded-full is reserved for dots/pulses like this. */
export function StatusDot({ tone, pulse = false }: { tone: StatusTone; pulse?: boolean }) {
  return (
    <Box
      role="presentation"
      radius="full"
      className={cn("h-2 w-2 shrink-0", dotMap[tone], pulse && "animate-pulse")}
    />
  );
}

/** Status pill. Tone comes from data — never hand-roll badge colors. */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Box
      direction="row"
      align="center"
      radius="full"
      className={cn("gap-1.5 border px-2.5 py-0.5", badgeMap[tone], className)}
    >
      <AppText variant="micro" weight={600} className="uppercase leading-none tracking-[0.06em] text-current">
        {children}
      </AppText>
    </Box>
  );
}
