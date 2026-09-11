"use client";

import { useEffect, useState } from "react";

function label(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Ticks once a second toward a unix-ms deadline. Null target = idle. */
export function useCountdown(target: number | null): { label: string; expired: boolean } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target === null || target - Date.now() <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (target === null) return { label: "--:--", expired: false };
  return { label: label(target - now), expired: target - now <= 0 };
}
