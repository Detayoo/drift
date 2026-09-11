"use client";

import { useCallback, useEffect, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { Dialog } from "@/components/Dialog";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { fetchJson } from "@/lib/http";
import { useToast } from "@/components/Toast";

type PendingPairing = {
  id: string;
  fromId: string;
  fromName: string;
  code: string;
};

/**
 * Incoming pairing requests. A request is only a question until a human
 * compares the code on both screens and confirms — never auto-accepted.
 */
export function PairingInbox() {
  const [pending, setPending] = useState<PendingPairing[]>([]);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  const refresh = useCallback(async () => {
    try {
      const body = await fetchJson<{ pairings: PendingPairing[] }>("/api/pairings");
      setPending(body.pairings);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const decide = async (id: string, accept: boolean, name: string) => {
    setBusy(true);
    try {
      await fetchJson(`/api/pairings/${id}/${accept ? "confirm" : "reject"}`, { method: "POST" });
      await refresh();
      if (accept) {
        notify({ title: `Paired with ${name || "them"}`, message: "Their files arrive without asking now.", tone: "ok" });
      }
    } catch {
      notify({ title: "That didn't work", message: "Couldn't send your answer. Try again.", tone: "err" });
    } finally {
      setBusy(false);
    }
  };

  const current = pending[0];

  return (
    <Dialog
      open={pending.length > 0}
      onOpenChange={() => {}}
      closable={false}
      label="Incoming pairing request"
      title={`${current?.fromName || "A nearby device"} wants to pair`}
      description="Pairing lets their files arrive without asking. Only confirm if you started this."
    >
      <Box gap="md" align="center" className="pt-4 text-center">
        <AppText variant="micro" tone="muted">Their screen must show this exact code:</AppText>
        <AppText variant="mono" weight={600} className="text-[28px] tracking-[0.2em]">
          {current?.code ?? "··· ···"}
        </AppText>
        <Box gap="sm" className="w-full">
          <AppButton
            label="Confirm pairing"
            disabled={busy || !current}
            onClick={() => {
              if (current) void decide(current.id, true, current.fromName);
            }}
          >
            Confirm
          </AppButton>
          <AppButton
            label="Decline pairing"
            tone="secondary"
            disabled={busy || !current}
            onClick={() => {
              if (current) void decide(current.id, false, current.fromName);
            }}
          >
            Decline
          </AppButton>
        </Box>
      </Box>
    </Dialog>
  );
}
