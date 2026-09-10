"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme";
import { ToastProvider } from "@/components/Toast";

/** Client-side app providers. Mounting here proves boot succeeded. */
export function Providers({ children }: { children?: ReactNode }) {
  useEffect(() => {
    (window as unknown as { __drift_ok?: boolean }).__drift_ok = true;
  }, []);
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
