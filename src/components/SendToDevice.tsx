"use client";

import { IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { DropZone } from "@/components/DropZone";
import { StatusBadge, StatusDot } from "@/components/Status";
import { TextField } from "@/components/fields";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { formatBytes, uploadFile, validateFile } from "@/lib/upload";
import { formatEta, formatSpeed } from "@/lib/transfer";
import { useTransfer } from "@/hooks/useTransfer";
import { fetchJson, isNetworkFailure } from "@/lib/http";
import { normalizeDeviceUrl } from "@/lib/invite";

type SendState = "idle" | "offering" | "awaiting" | "sending" | "done" | "declined" | "error";

const LAST_DEVICE_KEY = "drift-last-device";

/**
 * Device-to-device sender. Offer first, stream only on accept,
 * with an explicit state machine throughout.
 */
export function SendToDevice({
  deviceId,
  deviceName,
  prefill,
}: {
  deviceId: string;
  deviceName: string;
  prefill?: { address: string; name: string | null } | null;
}) {
  const [address, setAddress] = useState("");
  const [manual, setManual] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const transfer = useTransfer();
  const snap = transfer.snapshot;

  useEffect(() => {
    setAddress(window.localStorage.getItem(LAST_DEVICE_KEY) ?? "");
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (prefill?.address) {
      setAddress(prefill.address);
      setManual(false);
    }
  }, [prefill?.address]);

  const stopPoll = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const reset = () => {
    stopPoll();
    transfer.reset();
    setFile(null);
    setError(null);
    setState("idle");
  };

  const send = async () => {
    if (!file || state === "offering" || state === "awaiting" || state === "sending") return;
    const problem = validateFile(file);
    if (problem) {
      setError(problem);
      setState("error");
      return;
    }
    let base: string;
    try {
      base = normalizeDeviceUrl(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That address doesn't look right.");
      setState("error");
      return;
    }
    window.localStorage.setItem(LAST_DEVICE_KEY, base);

    setState("offering");
    setError(null);
    let offerId: string;
    try {
      offerId = (
        await fetchJson<{ id: string }>(`${base}/api/offers`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ filename: file.name, size: file.size, fromId: deviceId, fromName: deviceName }),
        })
      ).id;
    } catch (err) {
      const message =
        err instanceof Error && !isNetworkFailure(err)
          ? err.message
          : "Couldn't reach that device. Same Wi-Fi on both?";
      setError(message);
      setState("error");
      return;
    }

    setState("awaiting");
    let tries = 0;
    pollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const offer = await fetchJson<{ state: string; grant?: string }>(`${base}/api/offers/${offerId}`);
        if (offer.state === "accepted" && offer.grant) {
          stopPoll();
          setState("sending");
          transfer.start(file, (f, p, s) =>
            uploadFile(f, p, {
              baseUrl: base,
              grant: offer.grant,
              signal: s,
              probePath: "/api/transfers/resume",
              resumeKey: offerId,
            }),
          );
        } else if (offer.state === "rejected") {
          stopPoll();
          setState("declined");
        } else if (offer.state === "expired" || offer.state === "failed" || tries >= 60) {
          stopPoll();
          setError("The offer expired before they answered.");
          setState("error");
        }
      } catch {
        if (tries >= 60) {
          stopPoll();
          setError("Lost contact while waiting for an answer.");
          setState("error");
        }
      }
    }, 2000);
  };

  const snapStatus = snap?.status;
  useEffect(() => {
    if (snapStatus === "done") setState("done");
    else if (snapStatus === "error") setState("error");
  }, [snapStatus]);

  const pct = snap && snap.size > 0 ? Math.min(100, Math.round((snap.sent / snap.size) * 100)) : 0;
  const pace =
    !snap || snap.speedBps === null
      ? "Starting…"
      : `${formatSpeed(snap.speedBps)}${snap.etaSec ? ` · ${formatEta(snap.etaSec)}` : ""}`;

  return (
    <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg">
      <AppText variant="micro" tone="faint">send to another device</AppText>

      {(state === "idle" || state === "declined") && (
        <Box gap="md">
          {prefill && !manual ? (
            <Box direction="row" align="center" gap="sm" tint="sunken" bordered border="soft" radius="md" className="px-3.5 py-2.5">
              <StatusDot tone="accent" />
              <Box className="min-w-0 flex-1">
                <AppText variant="small" weight={600} truncate>To {prefill.name || prefill.address}</AppText>
                <AppText variant="micro" tone="muted">From their invite — no typing needed.</AppText>
              </Box>
              <AppButton label="Enter a different address" tone="ghost" size="sm" onClick={() => setManual(true)}>
                Change
              </AppButton>
            </Box>
          ) : (
            <TextField
              name="device-address"
              label="Device address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="http://192.168.1.5:3000"
              helper="From the other device's QR code or This device card."
            />
          )}
          <DropZone onFile={(next) => { setFile(next); setError(null); if (state !== "idle") setState("idle"); }} />
          {file && (
            <AppText variant="small" tone="secondary" truncate>
              {file.name} · {formatBytes(file.size)}
            </AppText>
          )}
          {state === "declined" && (
            <AppText variant="small" tone="warn">They declined. No bytes were sent.</AppText>
          )}
          <AppButton label="Send offer to device" iconLeft={IconSend} disabled={!file} onClick={() => { void send(); }}>
            Offer file
          </AppButton>
        </Box>
      )}

      {(state === "offering" || state === "awaiting") && (
        <Box gap="sm">
          <AppText variant="small" weight={600}>
            {state === "offering" ? "Sending the offer…" : "Waiting for them to accept…"}
          </AppText>
          <AppText variant="small" tone="secondary">
            {file?.name} · {file ? formatBytes(file.size) : ""} · the offer expires in 2 minutes.
          </AppText>
          <AppButton label="Cancel offer" tone="secondary" size="sm" onClick={reset}>
            Cancel
          </AppButton>
        </Box>
      )}

      {(state === "sending" || snap?.status === "uploading" || snap?.status === "verifying") && snap && (
        <Box gap="sm" role="status" label="Sending progress">
          <AppText variant="small" weight={600} truncate>Sending {snap.fileName}</AppText>
          <AppText variant="mono" tone="secondary" aria-live="polite">
            {formatBytes(snap.sent)} / {formatBytes(snap.size)} · {pct}% · {pace}
          </AppText>
          <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
            <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
          </Box>
          <AppButton label="Cancel transfer" tone="ghost" size="sm" onClick={() => { transfer.cancel(); reset(); }}>
            Cancel
          </AppButton>
        </Box>
      )}

      {state === "done" && snap?.status === "done" && snap.result && (
        <Box gap="sm" role="status" label="Transfer complete">
          <Box direction="row" align="center" gap="sm">
            <AppText variant="small" weight={600} truncate className="min-w-0 flex-1">{snap.result.filename} arrived</AppText>
            <StatusBadge tone="ok">Sent</StatusBadge>
          </Box>
          <AppText variant="small" tone="secondary">
            {formatBytes(snap.result.bytes)} verified on their machine in {(snap.result.ms / 1000).toFixed(1)}s.
          </AppText>
          <AppButton label="Send another file" tone="secondary" onClick={reset}>
            Send another
          </AppButton>
        </Box>
      )}

      {(state === "error" || snap?.status === "error") && (
        <Box gap="sm" tint="err-bg" pad="lg" className="border-l-2 border-l-err" role="alert">
          <AppText variant="subheading" weight={600}>That didn&apos;t go through</AppText>
          <AppText variant="small" tone="secondary">{snap?.error ?? error ?? "Couldn't send it."}</AppText>
          <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
            <AppButton label="Try again" onClick={() => { if (snap) transfer.retry(); else void send(); }}>
              {snap && snap.sent > 0 ? "Resume" : "Try again"}
            </AppButton>
            <AppButton label="Start over" tone="secondary" onClick={reset}>
              Start over
            </AppButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
