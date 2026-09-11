import * as DialogPrimitive from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/IconButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";

const SHEET_CLOSE_DISTANCE = 100;
const SHEET_CLOSE_VELOCITY = 500;

/**
 * Adaptive dialog. Desktop: centered panel. Mobile: bottom sheet with a knob.
 * Overlay + Escape + scroll-lock come from Radix. Border, never shadow.
 * Entrances ride CSS keyframes; exits ride motion (desktop fades back,
 * the sheet slides home).
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
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const sheet = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  const fade = { duration: reduceMotion ? 0 : 0.25, ease: "easeOut" as const };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay forceMount asChild>
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: fade }}
                aria-label="Close dialog"
                className="dialog-overlay fixed inset-0 z-50 cursor-default bg-overlay"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content forceMount asChild>
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                exit={sheet ? { y: "100%", transition: fade } : { opacity: 0, scale: 0.96, y: 8, transition: fade }}
                drag={sheet ? "y" : false}
                dragListener={false}
                dragControls={sheet ? dragControls : undefined}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (info.offset.y > SHEET_CLOSE_DISTANCE || info.velocity.y > SHEET_CLOSE_VELOCITY) {
                    onOpenChange(false);
                  }
                }}
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
                <Box
                  role="presentation"
                  onPointerDown={(e) => dragControls.start(e)}
                  className="hidden touch-none cursor-grab justify-center pb-2 select-none active:cursor-grabbing max-sm:flex"
                >
                  <Box radius="full" className="h-[5px] w-9 bg-field" />
                </Box>
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
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
