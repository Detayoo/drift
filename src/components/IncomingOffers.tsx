"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { Dialog } from "@/components/Dialog";
import { StatusBadge } from "@/components/Status";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { formatBytes } from "@/lib/upload";
import { fetchJson } from "@/lib/http";
import { useToast } from "@/components/Toast";

type IncomingOffer = {
  id: string;
  filename: string;
  size: number;
  fromId: string;
  fromName: string;
  state: string;
  verified: boolean;
  received: number;
  total: number;
};

/**
 * Receiver side: watches this device's offers, asks about each one,
 * and reports live progress once accepted.
 */
export function IncomingOffers({ onReceived }: { onReceived: () => void }) {
  const [offers, setOffers] = useState<IncomingOffer[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const celebrated = useRef<Set<string>>(new Set());
  const { notify } = useToast();

  const refresh = useCallback(async () => {
    try {
      setOffers((await fetchJson<{ offers: IncomingOffer[] }>("/api/offers")).offers);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 2500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const decide = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      await fetchJson(`/api/offers/${id}/${accept ? "accept" : "reject"}`, { method: "POST" });
      if (accept) celebrated.current.add(id);
      await refresh();
    } catch {
      notify({ title: "That didn't work", message: "Couldn't send your answer. Try again.", tone: "err" });
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    const check = async () => {
      for (const id of celebrated.current) {
        try {
          const offer = await fetchJson<{ state: string }>(`/api/offers/${id}`);
          if (offer.state === "done") {
            celebrated.current.delete(id);
            onReceived();
            const done = offers.find((o) => o.id === id);
            notify({ title: `Received ${done?.filename ?? "the file"}`, message: "Verified byte-for-byte.", tone: "ok" });
          } else if (offer.state === "failed" || offer.state === "expired") {
            celebrated.current.delete(id);
            notify({ title: "Transfer failed", message: "The connection broke. Ask them to send again.", tone: "err" });
          }
        } catch {
          continue;
        }
      }
    };
    if (celebrated.current.size > 0) void check();
  }, [offers, notify, onReceived]);

  const pending = offers.filter((o) => o.state === "pending");
  const current = pending[0];
  const sending = offers.filter((o) => o.state === "sending" || o.state === "accepted");

  return (
    <Box gap="md">
      {sending.map((offer) => {
        const pct = offer.total > 0 ? Math.min(100, Math.round((offer.received / offer.total) * 100)) : 0;
        return (
          <Box key={offer.id} gap="sm" bordered border="line" radius="lg" tint="raised" pad="lg" role="status" label={`Receiving ${offer.filename}`}>
            <Box direction="row" align="center" gap="sm">
              <AppText variant="small" weight={600} truncate className="min-w-0 flex-1">Receiving {offer.filename}</AppText>
              {offer.verified && <StatusBadge tone="ok">Verified</StatusBadge>}
            </Box>
            <AppText variant="mono" tone="secondary" aria-live="polite">
              {formatBytes(offer.received)} / {formatBytes(offer.total)} · {pct}%
            </AppText>
            <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
              <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
            </Box>
          </Box>
        );
      })}

      <Dialog
        open={pending.length > 0}
        onOpenChange={() => {}}
        closable={false}
        label="Incoming file offer"
        title={`${current?.fromName || "A nearby device"} wants to send ${current?.filename ?? "a file"}`}
        description={current ? `${formatBytes(current.size)} · nothing lands until you accept.` : undefined}
      >
        <Box gap="sm" className="pt-4">
          <AppButton
            label="Accept transfer"
            disabled={busyId === current?.id}
            onClick={() => { if (current) void decide(current.id, true); }}
          >
            Accept
          </AppButton>
          <AppButton
            label="Decline transfer"
            tone="secondary"
            disabled={busyId === current?.id}
            onClick={() => { if (current) void decide(current.id, false); }}
          >
            Decline
          </AppButton>
        </Box>
      </Dialog>
    </Box>
  );
}
