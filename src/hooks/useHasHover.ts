"use client";

import { useEffect, useState } from "react";

/**
 * True when the primary pointer can hover (mouse/trackpad). Touch phones
 * and most tablets report otherwise, so this gates hover-only affordances
 * (tooltips, hover reveals). Never a pixel breakpoint: width can't tell
 * whether a device can hover. SSR default is false to match first paint.
 */
export function useHasHover(): boolean {
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasHover(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return hasHover;
}
