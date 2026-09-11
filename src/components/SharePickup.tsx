"use client";

import QRCode from "react-qr-code";
import { useRef, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { DropZone } from "@/components/DropZone";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { StatusDot } from "@/components/Status";
import { formatBytes, uploadFile, validateFile } from "@/lib/upload";
import { formatEta, formatSpeed } from "@/lib/transfer";
import { useTransfer } from "@/hooks/useTransfer";
import { useCountdown } from "@/hooks/useCountdown";
import { useToast } from "@/components/Toast";

/**
 * Pickup links for browser-only receivers. Stages the file on this
 * server, then hands over a QR + link the other side downloads from.
 * Nothing streams until they open it; staged files expire in 30 minutes.
 */
export function SharePickup({ baseUrl }: { baseUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const transfer = useTransfer();
  const snap = transfer.snapshot;
  const transferKeyRef = useRef<string | null>(null);
  const pickupPath = snap?.status === "done" ? (snap.result?.pickupPath ?? null) : null;
  const expiresAt = snap?.status === "done" ? (snap.result?.expiresAt ?? null) : null;
  const countdown = useCountdown(expiresAt);

  const reset = () => {
    transfer.reset();
    transferKeyRef.current = null;
    setFile(null);
    setError(null);
  };

  const stage = () => {
    if (!file || snap?.status === "uploading") return;
    const problem = validateFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    transfer.start(file, (f, p, s) =>
      uploadFile(f, p, {
        path: "/api/stage",
        signal: s,
        probePath: "/api/stage/resume",
        resumeKey: transferKeyRef.current ?? undefined,
        onResumeKey: (id) => {
          transferKeyRef.current = id;
        },
      }),
    );
  };

  const remove = async () => {
    if (!pickupPath) return;
    const id = pickupPath.split("/").pop();
    const res = id ? await fetch(`/api/stage/${id}`, { method: "DELETE" }).catch(() => null) : null;
    if (!res?.ok) {
      notify({ title: "Couldn't remove it", message: "Try again in a moment.", tone: "err" });
      return;
    }
    reset();
    notify({ title: "Pickup removed", message: "The staged file was deleted.", tone: "ok" });
  };

  const uploading = snap?.status === "uploading" || snap?.status === "verifying";
  const failed = snap?.status === "error";
  const pct = snap && snap.size > 0 ? Math.min(100, Math.round((snap.sent / snap.size) * 100)) : 0;
  const pace =
    !snap || snap.speedBps === null
      ? "Starting…"
      : `${formatSpeed(snap.speedBps)}${snap.etaSec ? ` · ${formatEta(snap.etaSec)}` : ""}`;
  const pickupUrl = pickupPath ? `${baseUrl.replace(/\/+$/, "")}${pickupPath}` : null;

  return (
    <Box gap="md">
      {!pickupUrl && !uploading && !failed && snap?.status !== "done" && (
        <Box gap="md">
          <DropZone onFile={(next) => { setFile(next); setError(null); }} />
          {file && (
            <AppText variant="small" tone="secondary" truncate>
              {file.name} · {formatBytes(file.size)}
            </AppText>
          )}
          {error && (
            <Box tint="err-bg" pad="md" className="border-l-2 border-l-err" role="alert">
              <AppText variant="small">{error}</AppText>
            </Box>
          )}
          <AppButton label="Stage file for pickup" disabled={!file} onClick={stage}>
            Create pickup link
          </AppButton>
        </Box>
      )}
      {uploading && file && (
        <Box gap="sm" role="status" label="Staging progress">
          <AppText variant="mono" tone="secondary" aria-live="polite">
            {formatBytes(snap?.sent ?? 0)} / {formatBytes(file.size)} · {pct}% · {pace}
          </AppText>
          <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
            <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
          </Box>
          <AppButton label="Cancel staging" tone="ghost" size="sm" onClick={() => { transfer.cancel(); reset(); }}>
            Cancel
          </AppButton>
        </Box>
      )}
      {failed && (
        <Box gap="sm" tint="err-bg" pad="md" className="border-l-2 border-l-err" role="alert">
          <AppText variant="small">{snap?.error ?? "Staging failed."}</AppText>
          <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
            <AppButton label="Try again" size="sm" onClick={() => transfer.retry()}>
              {snap && snap.sent > 0 ? "Resume" : "Try again"}
            </AppButton>
            <AppButton label="Start over" tone="secondary" size="sm" onClick={reset}>
              Start over
            </AppButton>
          </Box>
        </Box>
      )}
      {snap?.status === "done" && !pickupPath && (
        <Box tint="err-bg" pad="md" className="border-l-2 border-l-err" role="alert">
          <AppText variant="small">The server didn&apos;t return a pickup link.</AppText>
          <AppButton label="Try again" size="sm" onClick={() => transfer.retry()}>
            Try again
          </AppButton>
        </Box>
      )}

      {pickupUrl && !countdown.expired && (
        <Box gap="md" align="center" className="text-center">
          <AppText variant="small" weight={600}>Ready for pickup</AppText>
          <Box direction="row" align="center" justify="center" gap="xs">
            <StatusDot tone="warn" pulse />
            <AppText variant="mono" tone="warn">Expires in {countdown.label}</AppText>
          </Box>
          <Box radius="md" bordered border="line" tint="raised" pad="md">
            <QRCode value={pickupUrl} size={200} bgColor="#FFFFFF" fgColor="#161616" />
          </Box>
          <AppText variant="mono" tone="secondary" className="break-all">
            {pickupUrl}
          </AppText>
          <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
            <AppButton
              label="Copy pickup link"
              tone="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(pickupUrl).then(
                  () => notify({ title: "Copied", message: "Share it anywhere.", tone: "ok" }),
                  () => notify({ title: "Copy failed", message: "Clipboard refused access.", tone: "err" }),
                );
              }}
            >
              Copy link
            </AppButton>
            <AppButton label="Remove pickup" tone="ghost" onClick={() => { void remove(); }}>
              Remove
            </AppButton>
          </Box>
          <AppText variant="micro" tone="faint">Deleting it here pulls it immediately.</AppText>
        </Box>
      )}
      {pickupUrl && countdown.expired && (
        <Box gap="sm" align="center" className="text-center">
          <AppText variant="small" weight={600} tone="err">This link expired</AppText>
          <AppButton label="Create a new pickup link" tone="secondary" onClick={reset}>
            New link
          </AppButton>
        </Box>
      )}
    </Box>
  );
}
