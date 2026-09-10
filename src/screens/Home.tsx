"use client";

import { IconFile, IconFileCheck, IconInbox, IconReload } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { CommandPalette, usePaletteHotkey } from "@/components/CommandPalette";
import { DropZone } from "@/components/DropZone";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, useSiteCommands } from "@/components/SiteHeader";
import { StatusBadge, StatusDot } from "@/components/Status";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, Divider, Main, Section } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import { formatBytes, uploadFile, type UploadResult } from "@/lib/upload";
import type { ReceivedFile } from "@/app/api/transfers/route";

type Status = "idle" | "ready" | "uploading" | "done" | "error";
type ListState = "loading" | "error" | "ready";

const MAX_BYTES = 5 * 1024 ** 3;

function scrollTo(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function HomeScreen() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [sent, setSent] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [received, setReceived] = useState<ReceivedFile[]>([]);
  const [listState, setListState] = useState<ListState>("loading");
  const commands = useSiteCommands(scrollTo);
  usePaletteHotkey(() => setPaletteOpen(true));

  const refreshReceived = useCallback(async () => {
    try {
      const res = await fetch("/api/transfers");
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { files: ReceivedFile[] };
      setReceived(body.files);
      setListState("ready");
    } catch {
      setListState("error");
    }
  }, []);

  useEffect(() => {
    void refreshReceived();
  }, [refreshReceived]);

  const choose = useCallback((next: File) => {
    if (next.size === 0) {
      setFile(null);
      setError("That file is empty — pick one with content.");
      setStatus("error");
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setError("That file is over the 5 GB Phase 1 limit.");
      setStatus("error");
      return;
    }
    setFile(next);
    setError(null);
    setResult(null);
    setSent(0);
    setStatus("ready");
  }, []);

  const send = useCallback(async () => {
    if (!file || status === "uploading") return;
    setStatus("uploading");
    setError(null);
    setSent(0);
    try {
      const done = await uploadFile(file, setSent);
      setResult(done);
      setStatus("done");
      void refreshReceived();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    }
  }, [file, status, refreshReceived]);

  const reset = useCallback(() => {
    setFile(null);
    setSent(0);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const pct = file && file.size > 0 ? Math.min(100, Math.round((sent / file.size) * 100)) : 0;

  return (
    <Box>
      <SiteHeader commands={commands} />
      <Main>
        <Container>
          <Box gap="md" className="pb-12 pt-16 max-md:pt-10">
            <Box direction="row" align="center" gap="sm">
              <StatusDot tone="accent" pulse />
              <AppText variant="mono" tone="secondary">phase 1 · this device</AppText>
            </Box>
            <AppText variant="display" headingLevel={1} className="max-w-[16ch]">
              Send a file to this machine.
            </AppText>
            <AppText variant="body" tone="secondary" className="max-w-[56ch]">
              Drop it below. It streams straight to disk on this computer — nothing uploaded, nothing held in memory.
            </AppText>
          </Box>

          {/* ── Transfer surface ── */}
          <Box gap="md" className="pb-4">
            {status === "idle" && (
              <Box id="dropzone">
                <DropZone onFile={choose} />
              </Box>
            )}

            {status === "ready" && file && (
              <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg">
                <Box direction="row" align="center" gap="sm">
                  <Icon icon={IconFile} size={22} className="text-ink-2" />
                  <Box className="min-w-0 flex-1">
                    <AppText variant="small" weight={600} truncate>{file.name}</AppText>
                    <AppText variant="micro" tone="muted">{formatBytes(file.size)} · ready</AppText>
                  </Box>
                </Box>
                <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
                  <AppButton label={`Send ${file.name}`} onClick={send}>
                    Send it
                  </AppButton>
                  <AppButton label="Choose a different file" tone="secondary" onClick={reset}>
                    Choose different
                  </AppButton>
                </Box>
              </Box>
            )}

            {status === "uploading" && file && (
              <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg" role="status" label="Upload progress">
                <Box direction="row" align="center" gap="sm">
                  <Icon icon={IconFile} size={22} className="text-ink-2" />
                  <Box className="min-w-0 flex-1">
                    <AppText variant="small" weight={600} truncate>{file.name}</AppText>
                    <AppText variant="mono" tone="secondary" aria-live="polite">
                      {formatBytes(sent)} / {formatBytes(file.size)} · {pct}%
                    </AppText>
                  </Box>
                </Box>
                <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
                  <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
                </Box>
              </Box>
            )}

            {status === "done" && result && (
              <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg" role="status" label="Upload complete">
                <Box direction="row" align="center" gap="sm">
                  <Icon icon={IconFileCheck} size={22} className="text-ok" />
                  <Box className="min-w-0 flex-1">
                    <AppText variant="small" weight={600} truncate>{result.filename}</AppText>
                    <AppText variant="small" tone="secondary">
                      {formatBytes(result.bytes)} sent · {formatBytes(result.bytes)} kept · {(result.ms / 1000).toFixed(1)}s
                    </AppText>
                  </Box>
                  <StatusBadge tone="ok">Verified</StatusBadge>
                </Box>
                <AppButton label="Send another file" tone="secondary" iconLeft={IconReload} onClick={reset}>
                  Send another
                </AppButton>
              </Box>
            )}

            {status === "error" && (
              <Box gap="md" bordered border="line" radius="lg" tint="err-bg" pad="lg" className="border-l-2 border-l-err" role="alert">
                <AppText variant="subheading" weight={600}>That didn&apos;t go through</AppText>
                <AppText variant="small" tone="secondary">{error ?? "Upload failed."}</AppText>
                <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
                  {file && (
                    <AppButton label="Retry upload" onClick={send}>
                      Try again
                    </AppButton>
                  )}
                  <AppButton label="Choose a different file" tone="secondary" onClick={reset}>
                    Choose different
                  </AppButton>
                </Box>
              </Box>
            )}
          </Box>

          <Divider />

          {/* ── Received ── */}
          <Section label="Received on this machine">
            <Box id="received" gap="md" className="scroll-mt-24 py-12">
              <Box direction="row" align="center" gap="sm">
                <Icon icon={IconInbox} size={20} className="text-ink-2" />
                <AppText variant="section" headingLevel={2}>Received on this machine</AppText>
              </Box>
              {listState === "loading" && <LoadingState message="Reading the inbox" />}
              {listState === "error" && <ErrorState message="The inbox couldn't be read." onRetry={() => { setListState("loading"); void refreshReceived(); }} />}
              {listState === "ready" && received.length === 0 && (
                <EmptyState heading="Nothing received yet" message="Send your first file above — it lands here." />
              )}
              {listState === "ready" && received.length > 0 && (
                <Box>
                  {received.map((item, i) => (
                    <Box key={item.id}>
                      {i > 0 ? <Divider /> : null}
                      <Box direction="row" align="center" gap="md" className="py-3.5">
                        <AppText variant="mono" tone="faint" className="w-10 shrink-0">{item.id}</AppText>
                        <AppText variant="small" weight={500} truncate className="min-w-0 flex-1">{item.filename}</AppText>
                        <AppText variant="micro" tone="muted" className="shrink-0 max-md:hidden">
                          {new Date(item.receivedAt).toLocaleString()}
                        </AppText>
                        <AppText variant="mono" tone="secondary" className="shrink-0">{formatBytes(item.bytes)}</AppText>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Section>

          <Divider />

          <Box className="py-8">
            <AppText variant="micro" tone="faint">
              Phase 1 · same-device primitive. Network transfers arrive in Phase 3 — discovery in Phase 4.
            </AppText>
          </Box>
        </Container>
      </Main>
      <SiteFooter />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </Box>
  );
}
