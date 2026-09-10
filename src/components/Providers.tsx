"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme";
import { ToastProvider } from "@/components/Toast";

/** Client-side app providers. Server layout stays lean. */
export function Providers({ children }: { children?: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
