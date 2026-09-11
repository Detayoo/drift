import { IconExclamationCircle, IconFolderOff, IconLoader2 } from "@tabler/icons-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "@/lib/motion";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Icon } from "@/components/primitives/Icon";

function StateShell({
  icon,
  heading,
  message,
  children,
}: {
  icon?: ReactNode;
  heading?: ReactNode;
  message?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.micro}>
      <Box align="center" justify="center" gap="md" className="mx-auto w-full max-w-[420px] px-6 py-16 text-center">
        {icon}
        {heading ? (
          <AppText variant="section" headingLevel={2}>{heading}</AppText>
        ) : null}
        {message ? (
          <AppText variant="small" tone="secondary">{message}</AppText>
        ) : null}
        {children}
      </Box>
    </motion.div>
  );
}

/** Full-area loading. Never a blank screen while fetching. */
export function LoadingState({ message = "Loading" }: { message?: ReactNode }) {
  return (
    <StateShell
      icon={
        <Box
          align="center"
          justify="center"
          radius="md"
          bordered
          border="line"
          tint="raised"
          className="h-14 w-14"
        >
          <Icon icon={IconLoader2} size={24} className="animate-spin text-ink-2" />
        </Box>
      }
      message={message}
    />
  );
}

/** Empty data with an optional forward action. */
export function EmptyState({
  heading = "Nothing here yet",
  message,
  actionLabel,
  onAction,
}: {
  heading?: ReactNode;
  message?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <StateShell
      icon={
        <Box align="center" justify="center" radius="md" bordered border="line" tint="raised" className="h-14 w-14">
          <Icon icon={IconFolderOff} size={24} className="text-ink-2" />
        </Box>
      }
      heading={heading}
      message={message}
    >
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} tone="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </AppButton>
      ) : null}
    </StateShell>
  );
}

/** Failure with retry. Errors are useful sentences, never "Something went wrong". */
export function ErrorState({
  message = "This didn't load.",
  onRetry,
}: {
  message?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <StateShell
      icon={
        <Box align="center" justify="center" radius="md" bordered border="line" tint="err-bg" className="h-14 w-14">
          <Icon icon={IconExclamationCircle} size={24} className="text-err" />
        </Box>
      }
      heading="Couldn't load this"
      message={message}
    >
      {onRetry ? (
        <AppButton label="Try again" tone="secondary" size="sm" onClick={onRetry}>
          Try again
        </AppButton>
      ) : null}
    </StateShell>
  );
}
