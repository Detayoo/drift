"use client";

import { useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { Dialog } from "@/components/Dialog";
import { TextField } from "@/components/fields";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { normalizeDeviceUrl } from "@/lib/invite";
import { newNonce, newSecret, pairingCode, savePaired } from "@/lib/pairing";
import { useToast } from "@/components/Toast";

type Phase = "form" | "waiting" | "confirmed" | "declined" | "expired" | "error";

/**
 * Outbound pairing. Sends a request carrying a fresh secret, shows the
 * short code for both humans to compare, and stores trust only after
 * the other side confirms.
 */
export function PairDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  onPaired,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
  onPaired: () => void;
}) {
  const [address, setAddress] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (open) {
      setPhase("form");
      setCode(null);
      setError(null);
    } else if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [open ]);

  useEffect(
    () => () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    },
    [],
  );

  const submit = async () => {
    let base: string;
    try {
      base = normalizeDeviceUrl(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That address doesn't look right.");
      return;
    }
    const secret = newSecret();
    const nonceA = newNonce();
    setError(null);
    let created: { pairId: string; nonceB: string; code: string };
    try {
      const res = await fetch(`${base}/api/pair`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromId: deviceId, fromName: deviceName, secret, nonceA }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `They refused pairing (HTTP ${res.status}).`);
      }
      created = (await res.json()) as { pairId: string; nonceB: string; code: string };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach that device. Same Wi-Fi on both?");
      setPhase("error");
      return;
    }
    if (pairingCode(nonceA, created.nonceB) !== created.code) {
      setError("The codes don't match. Someone may be interfering — stop and retry in person.");
      setPhase("error");
      return;
    }
    setCode(created.code);
    setPhase("waiting");

    let tries = 0;
    pollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch(`${base}/api/pair/${created.pairId}`);
        if (!res.ok) throw new Error();
        const pair = (await res.json()) as {
          state: string;
          deviceId: string | null;
          deviceName: string | null;
        };
        if (pair.state === "confirmed") {
          if (pollRef.current !== null) window.clearInterval(pollRef.current);
          if (!pair.deviceId) {
            setError("They confirmed, but their identity never arrived. Ask them to open Drift and pair again.");
            setPhase("error");
            return;
          }
          savePaired(base, { deviceId: pair.deviceId, name: pair.deviceName || "Unnamed device", secret });
          try {
            const store = await fetch("/api/trust", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id: pair.deviceId, name: pair.deviceName || "", secret }),
            });
            if (!store.ok) throw new Error();
          } catch {
            notify({ title: "Paired with a catch", message: "They trust you, but this machine couldn't save it.", tone: "warn" });
          }
          setPhase("confirmed");
          onPaired();
          notify({ title: `Paired with ${pair.deviceName || "them"}`, message: "Their files arrive without asking now.", tone: "ok" });
          onOpenChange(false);
        } else if (pair.state === "declined") {
          if (pollRef.current !== null) window.clearInterval(pollRef.current);
          setPhase("declined");
        } else if (pair.state === "expired" || tries >= 150) {
          if (pollRef.current !== null) window.clearInterval(pollRef.current);
          setPhase("expired");
        }
      } catch {
        if (tries >= 150) {
          if (pollRef.current !== null) window.clearInterval(pollRef.current);
          setPhase("expired");
        }
      }
    }, 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Pair a device"
      title="Pair a device"
      description="They confirm on their screen. Afterwards, files flow both ways without asking."
    >
      {phase === "form" && (
        <Box gap="md" className="pt-4">
          <TextField
            name="pair-address"
            label="Their address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="http://192.168.1.5:3000"
            helper="From their This device card or QR code."
          />
          <AppButton label="Send pairing request" onClick={() => { void submit(); }}>
            Send request
          </AppButton>
        </Box>
      )}
      {phase === "waiting" && (
        <Box gap="sm" align="center" className="pt-4 text-center" role="status" label="Waiting for confirmation">
          <AppText variant="small" tone="secondary">Make sure their screen shows this exact code:</AppText>
          <AppText variant="mono" weight={600} className="text-[28px] tracking-[0.2em]">
            {code ?? "··· ···"}
          </AppText>
          <AppText variant="micro" tone="faint">Waiting for them to confirm…</AppText>
          <AppButton label="Cancel pairing" tone="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </AppButton>
        </Box>
      )}
      {phase === "confirmed" && (
        <Box gap="sm" align="center" className="pt-4 text-center">
          <AppText variant="small" weight={600}>Paired.</AppText>
        </Box>
      )}
      {phase === "declined" && (
        <Box gap="sm" className="pt-4">
          <AppText variant="small" weight={600}>They declined.</AppText>
          <AppText variant="small" tone="secondary">Nothing was shared. You can ask them in person and try again.</AppText>
          <AppButton label="Close pairing dialog" tone="secondary" onClick={() => onOpenChange(false)}>
            Close
          </AppButton>
        </Box>
      )}
      {phase === "expired" && (
        <Box gap="sm" className="pt-4">
          <AppText variant="small" weight={600}>No answer in time.</AppText>
          <AppText variant="small" tone="secondary">The request expired after five minutes. Nothing was shared.</AppText>
          <AppButton label="Try pairing again" tone="secondary" onClick={() => setPhase("form")}>
            Try again
          </AppButton>
        </Box>
      )}
      {phase === "error" && (
        <Box gap="sm" tint="err-bg" pad="md" className="mt-4 border-l-2 border-l-err" role="alert">
          <AppText variant="small">{error ?? "Pairing failed."}</AppText>
          <AppButton label="Back to pairing form" tone="secondary" size="sm" onClick={() => setPhase("form")}>
            Back
          </AppButton>
        </Box>
      )}
    </Dialog>
  );
}
