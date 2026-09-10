import * as DialogPrimitive from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/IconButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";

/**
 * Adaptive dialog. Desktop: centered panel. Mobile: bottom sheet.
 * Overlay + Escape + scroll-lock come from Radix. Border, never shadow.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  label,
  closable = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  label: string;
  closable?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          aria-label="Close dialog"
          className="dialog-overlay fixed inset-0 z-50 cursor-default bg-overlay"
        />
        <DialogPrimitive.Content
          aria-label={label}
          className={cn(
            "dialog-panel fixed z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-[28rem] flex-col",
            "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-line bg-raised p-6",
            "max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:top-auto",
            "max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0",
            "max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:p-5",
          )}
        >
          <Box direction="row" align="start" justify="between" gap="md" className="mb-2">
            <Box gap="xs" className="min-w-0 flex-1">
              {title ? (
                <DialogPrimitive.Title asChild>
                  <AppText variant="section" headingLevel={2}>{title}</AppText>
                </DialogPrimitive.Title>
              ) : null}
              {description ? (
                <DialogPrimitive.Description asChild>
                  <AppText variant="small" tone="secondary">{description}</AppText>
                </DialogPrimitive.Description>
              ) : null}
            </Box>
            {closable ? (
              <DialogPrimitive.Close asChild>
                <IconButton icon={IconX} label="Close dialog" />
              </DialogPrimitive.Close>
            ) : (
              <Box className="h-10 w-10" />
            )}
          </Box>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
