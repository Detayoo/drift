"use client";

import { IconCopy, IconDevices, IconFile, IconFileCheck, IconInbox, IconLink, IconQrcode, IconRadar, IconReload, IconSend, IconWifi } from "@tabler/icons-react";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { CommandPalette, usePaletteHotkey } from "@/components/CommandPalette";
import { Dialog } from "@/components/Dialog";
import { DropZone } from "@/components/DropZone";
import { IncomingOffers } from "@/components/IncomingOffers";
import { InlineEdit } from "@/components/InlineEdit";
import { NearbyDevices } from "@/components/NearbyDevices";
import { NearbyRadar } from "@/components/NearbyRadar";
import { SendToDevice } from "@/components/SendToDevice";
import { SharePickup } from "@/components/SharePickup";
import { TabBar } from "@/components/TabBar";

const NAV_ITEMS = [
  { id: "send", label: "Send", icon: IconSend },
  { id: "nearby", label: "Nearby", icon: IconRadar },
  { id: "device", label: "Device", icon: IconDevices },
  { id: "received", label: "Received", icon: IconInbox },
] as const;
import { IconButton } from "@/components/IconButton";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, useSiteCommands } from "@/components/SiteHeader";
import { StatusBadge, StatusDot } from "@/components/Status";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, Divider, Main, Section } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import { formatBytes, uploadFile, validateFile } from "@/lib/upload";
import { useNearbyPeers } from "@/hooks/useNearbyPeers";
import { formatEta, formatSpeed } from "@/lib/transfer";
import { useTransfer } from "@/hooks/useTransfer";
import { fetchJson } from "@/lib/http";
import { buildInviteLink, parseInvite } from "@/lib/invite";
import { getDeviceId, getDeviceName, setDeviceName as persistDeviceName, shortId } from "@/lib/device";
import { useToast } from "@/components/Toast";
import type { NetworkInfo } from "@/app/api/network/route";
import type { ReceivedFile } from "@/app/api/transfers/route";

type Status = "idle" | "ready" | "error";
type ListState = "loading" | "error" | "ready";

function scrollTo(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function HomeScreen() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const transfer = useTransfer();
  const snap = transfer.snapshot;
  const transferKeyRef = useRef<string | null>(null);
  const [received, setReceived] = useState<ReceivedFile[]>([]);
  const [listState, setListState] = useState<ListState>("loading");
  const commands = useSiteCommands(scrollTo);
  usePaletteHotkey(() => setPaletteOpen(true));

  const refreshReceived = useCallback(async () => {
    try {
      const body = await fetchJson<{ files: ReceivedFile[] }>("/api/transfers");
      setReceived(body.files);
      setListState("ready");
    } catch {
      setListState("error");
    }
  }, []);

  useEffect(() => {
    void refreshReceived();
  }, [refreshReceived]);

  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const peers = useNearbyPeers(deviceId, deviceName);
  const [net, setNet] = useState<NetworkInfo | null>(null);
  const [netState, setNetState] = useState<ListState>("loading");
  const [qrOpen, setQrOpen] = useState(false);
  const { notify } = useToast();

  const loadNet = useCallback(async () => {
    setNetState("loading");
    try {
      setNet(await fetchJson<NetworkInfo>("/api/network"));
      setNetState("ready");
    } catch {
      setNetState("error");
    }
  }, []);

  useEffect(() => {
    setDeviceId(getDeviceId());
    setDeviceName(getDeviceName());
    void loadNet();
  }, [loadNet]);

  const commitName = (next: string) => {
    const clean = persistDeviceName(next);
    setDeviceName(clean);
    notify({
      title: clean ? `This device is now “${clean}”` : "Device name cleared",
      message: "Other devices will see this name.",
      tone: "ok",
    });
  };

  const copyUrl = (url: string) => {
    void navigator.clipboard?.writeText(url).then(
      () => notify({ title: "Copied", message: "Open it on the other device.", tone: "ok" }),
      () => notify({ title: "Copy failed", message: "Clipboard refused access.", tone: "err" }),
    );
  };

  const [invite, setInvite] = useState<{ address: string; name: string | null } | null>(null);

  useEffect(() => {
    const targets = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    targets.forEach((el) => spy.observe(el));
    return () => spy.disconnect();
  }, []);

  const goSection = (id: string) => {
    setActiveSection(id);
    scrollTo(id);
  };
  const [peerDest, setPeerDest] = useState<{ address: string; name: string | null } | null>(null);
  const [sendMode, setSendMode] = useState<"direct" | "pickup">("direct");
  const [activeSection, setActiveSection] = useState<string>("send");

  useEffect(() => {
    const found = parseInvite(window.location.search);
    if (!found) return;
    setInvite(found);
    notify({
      title: found.name ? `Ready to send to ${found.name}` : "Device ready",
      message: "Pick a file below — the address is filled in.",
      tone: "ok",
    });
    scrollTo("send");
  }, [notify]);

  const choose = useCallback((next: File) => {
    const problem = validateFile(next);
    if (problem) {
      setFile(null);
      setFormError(problem);
      setStatus("error");
      return;
    }
    setFile(next);
    setFormError(null);
    setStatus("ready");
  }, []);

  const send = useCallback(() => {
    if (!file) return;
    transfer.start(file, (f, p, s) =>
      uploadFile(f, p, {
        signal: s,
        probePath: "/api/transfers/resume",
        resumeKey: transferKeyRef.current ?? undefined,
        onResumeKey: (id) => {
          transferKeyRef.current = id;
        },
      }),
    );
  }, [file, transfer]);

  const reset = useCallback(() => {
    transfer.reset();
    transferKeyRef.current = null;
    setFile(null);
    setFormError(null);
    setStatus("idle");
  }, [transfer]);

  const snapStatus = snap?.status;
  useEffect(() => {
    if (snapStatus === "done") void refreshReceived();
  }, [snapStatus, refreshReceived]);

  const pct = snap && snap.size > 0 ? Math.min(100, Math.round((snap.sent / snap.size) * 100)) : 0;
  const pace =
    !snap || snap.speedBps === null
      ? "Starting…"
      : `${formatSpeed(snap.speedBps)}${snap.etaSec ? ` · ${formatEta(snap.etaSec)}` : ""}`;
  const inviteLink = net?.urls[0] ? buildInviteLink(net.urls[0], deviceName) : null;

  return (
    <Box>
      <SiteHeader commands={commands} onOpenPalette={() => setPaletteOpen(true)} />
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

          {/* ── Transfer surface (this machine) ── */}
          <IncomingOffers onReceived={refreshReceived} />
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

            {(snap?.status === "uploading" || snap?.status === "verifying") && snap && (
              <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg" role="status" label="Upload progress">
                <Box direction="row" align="center" gap="sm">
                  <Icon icon={IconFile} size={22} className="text-ink-2" />
                  <Box className="min-w-0 flex-1">
                    <AppText variant="small" weight={600} truncate>{snap.fileName}</AppText>
                    <AppText variant="mono" tone="secondary" aria-live="polite">
                      {formatBytes(snap.sent)} / {formatBytes(snap.size)} · {pct}% · {pace}
                    </AppText>
                  </Box>
                </Box>
                <Box radius="full" tint="sunken" className="h-1.5 w-full overflow-hidden">
                  <Box radius="full" tint="accent" className="h-full transition-[width]" style={{ width: `${pct}%` }} />
                </Box>
                <AppButton label="Cancel upload" tone="ghost" size="sm" onClick={() => { transfer.cancel(); reset(); }}>
                  Cancel
                </AppButton>
              </Box>
            )}

            {snap?.status === "done" && snap.result && (
              <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg" role="status" label="Upload complete">
                <Box direction="row" align="center" gap="sm">
                  <Icon icon={IconFileCheck} size={22} className="text-ok" />
                  <Box className="min-w-0 flex-1">
                    <AppText variant="small" weight={600} truncate>{snap.result.filename}</AppText>
                    <AppText variant="small" tone="secondary">
                      {formatBytes(snap.result.bytes)} sent · {formatBytes(snap.result.bytes)} kept · {(snap.result.ms / 1000).toFixed(1)}s
                    </AppText>
                  </Box>
                  <StatusBadge tone="ok">Verified</StatusBadge>
                </Box>
                <AppButton label="Send another file" tone="secondary" iconLeft={IconReload} onClick={reset}>
                  Send another
                </AppButton>
              </Box>
            )}

            {(status === "error" || snap?.status === "error") && (
              <Box gap="md" tint="err-bg" pad="lg" className="border-l-2 border-l-err" role="alert">
                <AppText variant="subheading" weight={600}>That didn&apos;t go through</AppText>
                <AppText variant="small" tone="secondary">{snap?.error ?? formError ?? "Upload failed."}</AppText>
                <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
                  {snap && (
                    <AppButton label="Retry upload" onClick={() => transfer.retry()}>
                      {snap.sent > 0 ? "Resume" : "Try again"}
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

          {/* ── Send to another device ── */}
          <Section label="Send to another device">
            <Box id="send" gap="md" className="scroll-mt-24 py-12">
              <AppText variant="section" headingLevel={2}>Send to another device</AppText>
              <AppText variant="body" tone="secondary" className="max-w-[56ch]">
                Send it straight to a device that accepts, or share a link any browser can download.
              </AppText>
              <TabBar
                label="Send modes"
                collapseOnMobile={false}
                glassActive
                activeId={sendMode}
                onChange={(id) => setSendMode(id === "pickup" ? "pickup" : "direct")}
                items={[
                  { id: "direct", label: "Send file", icon: IconSend },
                  { id: "pickup", label: "Share link", icon: IconLink },
                ]}
              />
              {sendMode === "direct" ? (
                <SendToDevice deviceId={deviceId} deviceName={deviceName} prefill={peerDest ?? invite} />
              ) : net?.urls[0] ? (
                <SharePickup baseUrl={net.urls[0]} />
              ) : (
                <AppText variant="small" tone="muted">Waiting on the network address above.</AppText>
              )}
            </Box>
          </Section>

          <Divider />

          {/* ── Nearby ── */}
          <Section label="Nearby devices">
            <Box id="nearby" gap="md" className="scroll-mt-24 py-12">
              <AppText variant="section" headingLevel={2}>Nearby</AppText>
              <AppText variant="body" tone="secondary" className="max-w-[56ch]">
                Machines running Drift find each other on their own. Phones join by scan — they can&apos;t announce themselves.
              </AppText>
              <NearbyRadar peers={peers} />
              <NearbyDevices
                peers={peers}
                onSend={(peer) => {
                  setPeerDest({ address: peer.url, name: peer.name });
                  scrollTo("send");
                }}
              />
            </Box>
          </Section>

          <Divider />

          {/* ── This device ── */}
          <Section label="This device">
            <Box id="device" gap="md" className="scroll-mt-24 py-12">
              <AppText variant="section" headingLevel={2}>This device</AppText>
              <Box gap="md" bordered border="line" radius="lg" tint="raised" pad="lg">
                <AppText variant="micro" tone="faint">identity</AppText>
                <InlineEdit
                  value={deviceName}
                  emptyText="Unnamed device"
                  label="Device name"
                  onCommit={commitName}
                />
                <AppText variant="mono" tone="faint">id {deviceId ? shortId(deviceId) : "····"}</AppText>
                <Divider />
                <Box direction="row" align="center" gap="sm">
                  <StatusDot tone={netState === "error" ? "err" : "ok"} pulse={netState === "loading"} />
                  <AppText variant="small" weight={600}>
                    {netState === "loading" ? "Finding this machine on your Wi-Fi" : netState === "error" ? "Network info unavailable" : "Listening on your Wi-Fi"}
                  </AppText>
                </Box>
                {netState === "ready" && net && net.urls.length > 0 && (
                  <Box gap="xs">
                    {net.urls.map((url) => (
                      <Box key={url} direction="row" align="center" gap="sm" tint="sunken" bordered border="soft" radius="md" className="px-3.5 py-2.5">
                        <Icon icon={IconWifi} size={16} className="text-ink-3" />
                        <AppText variant="mono" truncate className="min-w-0 flex-1">{url}</AppText>
                        <IconButton icon={IconCopy} label={`Copy ${url}`} size={14} className="h-8 w-8" onClick={() => copyUrl(url)} />
                      </Box>
                    ))}
                    <AppButton label="Show connection QR code" tone="secondary" iconLeft={IconQrcode} onClick={() => setQrOpen(true)}>
                      Show QR code
                    </AppButton>
                    <AppText variant="micro" tone="muted">Same Wi-Fi on both devices. Guest and office networks often block devices from seeing each other. If scanning fails, type the address into the other browser.</AppText>
                  </Box>
                )}
                {netState === "ready" && net && net.urls.length === 0 && (
                  <AppText variant="small" tone="secondary">No local network found. Connect to Wi-Fi and reload.</AppText>
                )}
                {netState === "error" && (
                  <AppButton label="Retry network lookup" tone="secondary" size="sm" onClick={() => { void loadNet(); }}>
                    Try again
                  </AppButton>
                )}
              </Box>
            </Box>
          </Section>

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
              Nearby machines appear on their own, browsers pick up links. Discovery is UDP broadcast — guest networks may block it.
            </AppText>
          </Box>
        </Container>
      </Main>
      <SiteFooter />
      <TabBar
        label="Sections"
        docked="auto"
        labels="never"
        tipSide="left"
        glassActive
        items={[...NAV_ITEMS]}
        activeId={activeSection}
        onChange={goSection}
      />
      <Dialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        label="Connection QR code"
        title="Scan to connect"
        description="Point the other device's camera at this code. Both devices must be on the same Wi-Fi."
      >
        {inviteLink ? (
          <Box gap="md" align="center" className="pt-4">
            <Box radius="md" bordered border="line" tint="raised" pad="md">
              <QRCode value={inviteLink} size={220} bgColor="#FFFFFF" fgColor="#161616" />
            </Box>
            <AppText variant="mono" tone="secondary" className="break-all text-center">{net?.urls[0]}</AppText>
            <Box direction="row" gap="sm">
              <AppButton label="Copy invite link" className="min-w-0 flex-1" onClick={() => copyUrl(inviteLink)}>
                Copy invite
              </AppButton>
              <AppButton label="Copy connection address" tone="secondary" className="min-w-0 flex-1" onClick={() => net?.urls[0] && copyUrl(net.urls[0])}>
                Copy address
              </AppButton>
            </Box>
          </Box>
        ) : null}
      </Dialog>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </Box>
  );
}
