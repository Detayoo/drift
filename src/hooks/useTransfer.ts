"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTransfer, type TransferSnapshot, type TransferTransport } from "@/lib/transfer";

type Engine = ReturnType<typeof createTransfer>;

/**
 * Binds one transfer engine to React. Starting a new transfer cancels
 * whatever this hook was running — superseded engines can't overwrite
 * the current snapshot.
 */
export function useTransfer() {
  const ref = useRef<{ engine: Engine; gen: number } | null>(null);
  const [snapshot, setSnapshot] = useState<TransferSnapshot | null>(null);

  const start = useCallback((file: File, transport: TransferTransport) => {
    ref.current?.engine.cancel();
    const engine = createTransfer(file, transport);
    const mine = { engine, gen: (ref.current?.gen ?? 0) + 1 };
    ref.current = mine;
    engine.subscribe(() => {
      if (ref.current === mine) setSnapshot({ ...engine.getSnapshot() });
    });
    setSnapshot({ ...engine.getSnapshot() });
    engine.start();
  }, []);

  const cancel = useCallback(() => {
    ref.current?.engine.cancel();
  }, []);

  const retry = useCallback(() => {
    ref.current?.engine.retry();
  }, []);

  const reset = useCallback(() => {
    ref.current?.engine.reset();
  }, []);

  useEffect(() => {
    const current = ref.current;
    return () => {
      current?.engine.cancel();
    };
  }, []);

  return { snapshot, start, cancel, retry, reset };
}
