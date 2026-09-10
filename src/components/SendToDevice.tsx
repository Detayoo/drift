"use client";

import { IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { DropZone } from "@/components/DropZone";
import { StatusBadge } from "@/components/Status";
import { TextField } from "@/components/fields";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { formatBytes, uploadFile, validateFile, type UploadResult } from "@/lib/upload";

type SendState = "idle" | "offering" | "awaiting" | "sending" | "done" | "declined" | "error";

const LAST_DEVICE_KEY = "drift-last-device";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Enter the other device's address first.");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("That address must start with http:// or https://.");
  }
  return url.origin;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `${fallback} (HTTP ${res.status}).`;
}

/**
 * Device-to-device sender. Offer first, stream only on accept,
 * with an explicit state machine throughout.
 */
export function SendToDevice({ deviceId, deviceName }: { deviceId: string; deviceName: string }) {
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SendState>("idle");
  const [sent, setSent] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    setAddress(window.localStorage.getItem(LAST_DEVICE_KEY) ?? "");
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
  }, []);

  const stopPoll = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const reset = () => {
    stopPoll();
    setFile(null);
    setSent(0);
    setResult(null);
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
      base = normalizeUrl(address);
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
      const res = await fetch(`${base}/api/offers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, size: file.size, fromId: deviceId, fromName: deviceName }),
      });
      if (!res.ok) throw new Error(await readError(res, "The other device refused the offer."));
      offerId = ((await res.json()) as { id: string }).id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach that device. Same Wi-Fi on both?");
      setState("error");
      return;
    }

    setState("awaiting");
    let tries = 0;
    pollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch(`${base}/api/offers/${offerId}`);
        if (!res.ok) throw new Error();
        const offer = (await res.json()) as { state: string; grant?: string };
        if (offer.state === "accepted" && offer.grant) {
          stopPoll();
          setState("sending");
          setSent(0);
          try {
            const done = await uploadFile(file, setSent, { baseUrl: base, grant: offer.grant });
            setResult(done);
            setState("done");
          } catch (err) {
            setError(err instanceof Error ? err.message : "The transfer broke mid-stream.");
            setState("error");
          }
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

  const pct = file && file.size > 0 ? Math.min(100, Math.round((sent / file.size) * 100)) : 0;

  return (
    <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg">
      <AppText variant="micro" tone="faint">send to another device</AppText>

      {(state === "idle" || state === "error" || state === "declined") && (
        <Box gap="md">
          <TextField
            name="device-address"
            label="Device address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="http://192.168.1.5:3000"
            helper="From the other device's QR code or This device card."
          />
          <DropZone onFile={(next) => { setFile(next); setError(null); if (state !== "idle") setState("idle"); }} />
          {file && (
            <AppText variant="small" tone="secondary" truncate>
              {file.name} · {formatBytes(file.size)}
            </AppText>
          )}
          {state === "declined" && (
            <AppText variant="small" tone="warn">They declined. No bytes were sent.</AppText>
          )}
          {state === "error" && error && (
            <Box tint="err-bg" pad="md" className="border-l-2 border-l-err" role="alert">
              <AppText variant="small">{error}</AppText>
            </Box>
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

      {state === "sending" && file && (
        <Box gap="sm" role="status" label="Sending progress">
          <AppText variant="small" weight={600} truncate>Sending {file.name}</AppText>
          <AppText variant="mono" tone="secondary" aria-live="polite">
            {formatBytes(sent)} / {formatBytes(file.size)} · {pct}%
          </AppText>
          <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
            <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
          </Box>
        </Box>
      )}

      {state === "done" && result && (
        <Box gap="sm" role="status" label="Transfer complete">
          <Box direction="row" align="center" gap="sm">
            <AppText variant="small" weight={600} truncate className="min-w-0 flex-1">{result.filename} arrived</AppText>
            <StatusBadge tone="ok">Sent</StatusBadge>
          </Box>
          <AppText variant="small" tone="secondary">
            {formatBytes(result.bytes)} verified on their machine in {(result.ms / 1000).toFixed(1)}s.
          </AppText>
          <AppButton label="Send another file" tone="secondary" onClick={reset}>
            Send another
          </AppButton>
        </Box>
      )}
    </Box>
  );
}
