"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconInfoSquare,
  IconX,
  type TablerIcon,
} from "@tabler/icons-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { POP } from "@/lib/motion";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText, type TextTone } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Icon } from "@/components/primitives/Icon";

export type ToastTone = "neutral" | "info" | "ok" | "warn" | "err";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type ToastInput = {
  title: ReactNode;
  message?: ReactNode;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<{ notify: (toast: ToastInput) => void }>({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const toneConfig: Record<ToastTone, { frame: string; iconClass: string; text: TextTone; Icon: TablerIcon }> = {
  neutral: { frame: "border-l-ink bg-sunken", iconClass: "text-ink", text: "default", Icon: IconInfoCircle },
  info: { frame: "border-l-info bg-info-bg", iconClass: "text-info", text: "info", Icon: IconInfoSquare },
  ok: { frame: "border-l-ok bg-ok-bg", iconClass: "text-ok", text: "ok", Icon: IconCircleCheck },
  warn: { frame: "border-l-warn bg-warn-bg", iconClass: "text-warn", text: "warn", Icon: IconAlertTriangle },
  err: { frame: "border-l-err bg-err-bg", iconClass: "text-err", text: "err", Icon: IconAlertCircle },
};

const positionClass: Record<ToastPosition, string> = {
  "top-left": "left-6 top-6 items-start",
  "top-center": "left-1/2 top-6 -translate-x-1/2 items-center",
  "top-right": "right-6 top-6 items-end",
  "bottom-left": "bottom-6 left-6 items-start",
  "bottom-center": "bottom-6 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-6 right-6 items-end",
};

export function ToastProvider({
  children,
  position = "bottom-center",
}: {
  children?: ReactNode;
  position?: ToastPosition;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const notify = useCallback((input: ToastInput) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev.slice(-3), { ...input, id }]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      input.tone === "err" ? 6000 : 4500,
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <Box className={`pointer-events-none fixed z-[100] flex w-[min(400px,calc(100vw-2rem))] flex-col gap-2 ${positionClass[position]}`}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const tone = toast.tone ?? "neutral";
            const config = toneConfig[tone];
            return (
              <motion.div
                key={toast.id}
                role="status"
                initial={POP.initial}
                animate={POP.animate}
                exit={POP.exit}
                className={`pointer-events-auto flex w-full items-start gap-3 border border-line border-l-2 p-4 ${config.frame}`}
              >
                <Icon icon={config.Icon} size={20} className={`mt-0.5 ${config.iconClass}`} />
                <Box gap="xs" className="min-w-0 flex-1">
                  <AppText variant="small" weight={600}>{toast.title}</AppText>
                  {toast.message ? (
                    <AppText variant="small">{toast.message}</AppText>
                  ) : null}
                  {toast.actionLabel && toast.onAction ? (
                    <ActionButton
                      onClick={() => { toast.onAction?.(); dismiss(toast.id); }}
                      className="mt-1"
                    >
                      <AppText variant="small" tone={config.text} weight={600}>{toast.actionLabel}</AppText>
                    </ActionButton>
                  ) : null}
                </Box>
                <ActionButton aria-label="Dismiss notification" onClick={() => dismiss(toast.id)} className="rounded-md p-1 text-ink-3 hover:bg-hover">
                  <Icon icon={IconX} size={14} className="text-current" />
                </ActionButton>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>
    </ToastContext.Provider>
  );
}
