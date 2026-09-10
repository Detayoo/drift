"use client";

import QRCode from "react-qr-code";
import { useState } from "react";
import { AppButton } from "@/components/AppButton";
import { DropZone } from "@/components/DropZone";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { formatBytes, uploadFile, validateFile } from "@/lib/upload";
import { useToast } from "@/components/Toast";

/**
 * Pickup links for browser-only receivers. Stages the file on this
 * server, then hands over a QR + link the other side downloads from.
 * Nothing streams until they open it; staged files expire in 30 minutes.
 */
export function SharePickup({ baseUrl }: { baseUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [sent, setSent] = useState(0);
  const [staging, setStaging] = useState(false);
  const [pickupPath, setPickupPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  const reset = () => {
    setFile(null);
    setSent(0);
    setStaging(false);
    setPickupPath(null);
    setError(null);
  };

  const stage = async () => {
    if (!file || staging) return;
    const problem = validateFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setStaging(true);
    setError(null);
    setSent(0);
    try {
      const done = await uploadFile(file, setSent, { path: "/api/stage" });
      if (!done.pickupPath) throw new Error("The server didn't return a pickup link.");
      setPickupPath(done.pickupPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Staging failed.");
      setStaging(false);
    }
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

  const pct = file && file.size > 0 ? Math.min(100, Math.round((sent / file.size) * 100)) : 0;
  const pickupUrl = pickupPath ? `${baseUrl.replace(/\/+$/, "")}${pickupPath}` : null;

  return (
    <Box gap="md">
      {!pickupUrl && (
        <Box gap="md">
          <DropZone onFile={(next) => { setFile(next); setError(null); }} disabled={staging} />
          {file && !staging && (
            <AppText variant="small" tone="secondary" truncate>
              {file.name} · {formatBytes(file.size)}
            </AppText>
          )}
          {staging && file && (
            <Box gap="xs" role="status" label="Staging progress">
              <AppText variant="mono" tone="secondary" aria-live="polite">
                {formatBytes(sent)} / {formatBytes(file.size)} · {pct}%
              </AppText>
              <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
                <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
              </Box>
            </Box>
          )}
          {error && (
            <Box tint="err-bg" pad="md" className="border-l-2 border-l-err" role="alert">
              <AppText variant="small">{error}</AppText>
            </Box>
          )}
          <AppButton label="Stage file for pickup" disabled={!file || staging} onClick={() => { void stage(); }}>
            {staging ? "Staging…" : "Create pickup link"}
          </AppButton>
        </Box>
      )}

      {pickupUrl && (
        <Box gap="md" align="center" className="text-center">
          <AppText variant="small" weight={600}>Ready for pickup</AppText>
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
          <AppText variant="micro" tone="faint">Expires in 30 minutes. Deleting it here pulls it immediately.</AppText>
        </Box>
      )}
    </Box>
  );
}
