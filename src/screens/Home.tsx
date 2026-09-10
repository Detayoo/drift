"use client";

import {
  IconBolt,
  IconChevronRight,
  IconClick,
  IconDevices,
  IconLock,
  IconQrcode,
  IconRadar,
  IconRepeat,
  IconSend,
  IconServerOff,
  IconShieldCheck,
  IconTerminal2,
} from "@tabler/icons-react";
import { useCallback, useState } from "react";
import { AppButton } from "@/components/AppButton";
import { CommandPalette, usePaletteHotkey } from "@/components/CommandPalette";
import { Dialog } from "@/components/Dialog";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, useSiteCommands } from "@/components/SiteHeader";
import { StatusBadge, StatusDot } from "@/components/Status";
import { TextField } from "@/components/fields";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, Divider, Main, Section } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import { useToast } from "@/components/Toast";

function scrollTo(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

const STEPS = [
  { n: "01", icon: IconRadar, title: "Devices appear", body: "Open LocalDrop on two machines sharing a network. Each one shows up — no addresses to type, no accounts to create." },
  { n: "02", icon: IconDevices, title: "Choose a device", body: "Pick the destination the way you'd pick a contact. The offer states exactly what is being sent and how large it is." },
  { n: "03", icon: IconBolt, title: "It arrives directly", body: "Bytes stream device to device over your own network. Nothing is uploaded, nothing lingers in a cloud." },
] as const;

const PRINCIPLES = [
  { icon: IconServerOff, title: "Local-first", body: "No cloud storage, no accounts, no central backend. The local network is the transport." },
  { icon: IconLock, title: "Private by default", body: "Files stay on your devices. Nothing leaves the room unless you explicitly send it." },
  { icon: IconClick, title: "Zero friction", body: "No IP addresses, no ports, no cables of jargon. Drag a file toward a device and it moves." },
  { icon: IconRepeat, title: "Reliability over features", body: "A boring, resumable 1 GB transfer beats thirty half-built ideas. Interruptions resume, integrity verifies." },
] as const;

const ROADMAP = [
  { n: "0", name: "Product foundation", note: "Design system, shell, primitives.", tone: "accent" as const, tag: "Now" },
  { n: "1", name: "Smallest transfer", note: "One browser → one Node server → one file, streamed.", tone: "neutral" as const, tag: "Next" },
  { n: "2", name: "LAN access", note: "Second device joins via QR address.", tone: "neutral" as const, tag: "Queued" },
  { n: "3", name: "Two-device transfer", note: "Offer → accept → stream → verify.", tone: "neutral" as const, tag: "Queued" },
  { n: "4", name: "Auto discovery", note: "Devices find each other. No typing.", tone: "neutral" as const, tag: "Queued" },
  { n: "5–7", name: "Engine → resume → trust", note: "Backpressure, checkpoints, pairing.", tone: "neutral" as const, tag: "Queued" },
] as const;

export function HomeScreen() {
  const { notify } = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [demoName, setDemoName] = useState("");
  const commands = useSiteCommands(scrollTo);
  usePaletteHotkey(() => setPaletteOpen(true));
  const go = useCallback((id: string) => scrollTo(id), []);

  return (
    <Box>
      <SiteHeader commands={commands} />
      <Main>
        <Container>
          {/* ── Hero ── */}
          <Box gap="lg" className="pb-16 pt-20 max-md:pb-12 max-md:pt-12">
            <Box direction="row" align="center" gap="sm">
              <StatusDot tone="accent" pulse />
              <AppText variant="mono" tone="secondary">local-first · device-to-device</AppText>
            </Box>
            <AppText variant="display" headingLevel={1} className="max-w-[16ch]">
              Move files directly between your devices.
            </AppText>
            <AppText variant="body" tone="secondary" className="max-w-[52ch]">
              No cloud. No account. Just your network. Open LocalDrop, pick a nearby device, and the file arrives — streamed, verified, and private.
            </AppText>
            <Box direction="row" gap="sm" className="max-md:flex-col max-md:items-stretch">
              <AppButton label="See how it will work" size="lg" iconRight={IconChevronRight} onClick={() => go("how")}>
                How it will work
              </AppButton>
              <AppButton label="View the build order" size="lg" tone="secondary" onClick={() => go("roadmap")}>
                Build order
              </AppButton>
            </Box>
          </Box>

          <Divider />

          {/* ── Honest status: no fake networking ── */}
          <Box
            direction="row"
            align="center"
            gap="md"
            bordered
            border="line"
            radius="lg"
            tint="raised"
            className="my-10 px-5 py-4 max-md:flex-col max-md:items-start"
          >
            <Box direction="row" align="center" gap="sm">
              <StatusDot tone="neutral" />
              <AppText variant="small" weight={600}>Transfer engine — not built yet</AppText>
            </Box>
            <AppText variant="small" tone="secondary" className="max-md:w-full">
              Phase 0 is the foundation. Phase 1 proves the streaming primitive before anything pretends to transfer.
            </AppText>
          </Box>

          {/* ── How it will work ── */}
          <Section label="How it will work">
            <Box id="how" gap="md" className="scroll-mt-24 py-14">
              <AppText variant="mono" tone="faint">how it will work</AppText>
              <AppText variant="heading" headingLevel={2} className="max-w-[20ch]">Three moves. Nothing to learn.</AppText>
              <Box className="mt-4">
                {STEPS.map((step, i) => (
                  <Box key={step.n}>
                    {i > 0 ? <Divider /> : null}
                    <Box direction="row" gap="lg" className="py-7 max-md:flex-col max-md:gap-3">
                      <AppText variant="mono" tone="faint" className="w-10 shrink-0 pt-1">{step.n}</AppText>
                      <Box align="center" justify="center" radius="md" bordered border="line" tint="raised" className="h-12 w-12 shrink-0">
                        <Icon icon={step.icon} size={22} className="text-ink" />
                      </Box>
                      <Box gap="xs" className="min-w-0 flex-1">
                        <AppText variant="subheading" weight={600}>{step.title}</AppText>
                        <AppText variant="body" tone="secondary" className="max-w-[62ch]">{step.body}</AppText>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Section>

          <Divider />

          {/* ── Principles ── */}
          <Section label="Principles">
            <Box id="principles" gap="md" className="scroll-mt-24 py-14">
              <AppText variant="mono" tone="faint">non-negotiables</AppText>
              <AppText variant="heading" headingLevel={2}>Simple for you. Difficult underneath.</AppText>
              <Box direction="row" gap="md" wrap className="mt-4 max-md:flex-col">
                {PRINCIPLES.map((p) => (
                  <Box key={p.title} gap="sm" bordered border="line" radius="lg" tint="raised" pad="lg" className="min-w-[240px] flex-1">
                    <Icon icon={p.icon} size={22} className="text-ink" />
                    <AppText variant="subheading" weight={600}>{p.title}</AppText>
                    <AppText variant="small" tone="secondary">{p.body}</AppText>
                  </Box>
                ))}
              </Box>
            </Box>
          </Section>

          <Divider />

          {/* ── Build order ── */}
          <Section label="Build order">
            <Box id="roadmap" gap="md" className="scroll-mt-24 py-14">
              <AppText variant="mono" tone="faint">build order</AppText>
              <AppText variant="heading" headingLevel={2}>Prove the primitive, then add complexity.</AppText>
              <AppText variant="body" tone="secondary" className="max-w-[62ch]">
                Each phase ships only when the previous layer is reliable. The full sequence — all fifty phases — lives in the project document.
              </AppText>
              <Box className="mt-2">
                {ROADMAP.map((row, i) => (
                  <Box key={row.n}>
                    {i > 0 ? <Divider /> : null}
                    <Box direction="row" align="center" gap="md" className="py-4">
                      <AppText variant="mono" tone="faint" className="w-12 shrink-0">{row.n}</AppText>
                      <Box gap="xs" className="min-w-0 flex-1">
                        <AppText variant="small" weight={600}>{row.name}</AppText>
                        <AppText variant="small" tone="secondary">{row.note}</AppText>
                      </Box>
                      <StatusBadge tone={row.tone}>{row.tag}</StatusBadge>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box direction="row" gap="sm" className="mt-6 max-md:flex-col max-md:items-stretch">
                <AppButton label="Preview the transfer offer dialog" tone="secondary" iconLeft={IconSend} onClick={() => setDialogOpen(true)}>
                  Preview offer dialog
                </AppButton>
                <AppButton label="Preview a notification" tone="ghost" iconLeft={IconTerminal2} onClick={() => notify({ title: "Developer mode preview", message: "Every metric here will come from the real runtime.", tone: "ok" })}>
                  Preview notification
                </AppButton>
              </Box>
            </Box>
          </Section>

          <Divider />

          {/* ── System proof ── */}
          <Section label="Design system">
            <Box id="system" gap="md" className="scroll-mt-24 py-14">
              <AppText variant="mono" tone="faint">design system · phase 0 proof</AppText>
              <AppText variant="heading" headingLevel={2}>Every rectangle is a Box. Every word is AppText.</AppText>
              <AppText variant="body" tone="secondary" className="max-w-[62ch]">
                No raw tags outside primitives, no shadows anywhere, Tabler icons only. Name a device below — the demo stays on this machine and tells you so.
              </AppText>
              <Box direction="row" gap="md" className="mt-2 max-md:flex-col">
                <Box gap="sm" bordered border="line" radius="lg" tint="raised" pad="lg" className="flex-1">
                  <AppText variant="small" weight={600}>Pairing preview</AppText>
                  <AppText variant="micro" tone="muted">Phase 7 will ask both devices to confirm the same code.</AppText>
                  <Box direction="row" align="center" justify="center" gap="sm" tint="sunken" bordered border="soft" radius="md" className="px-4 py-5">
                    <Icon icon={IconQrcode} size={20} className="text-ink-3" />
                    <AppText variant="mono" weight={600} className="text-[22px] tracking-[0.2em]">742 921</AppText>
                  </Box>
                  <TextField
                    name="device-name"
                    label="Device name"
                    placeholder="Tayo's iPhone"
                    helper="Stored locally. Never uploaded."
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                  />
                  <AppButton
                    label="Save device name"
                    tone="secondary"
                    iconLeft={IconShieldCheck}
                    onClick={() =>
                      notify({
                        title: demoName.trim() ? `Saved “${demoName.trim()}”` : "Name cleared",
                        message: "Demo only — nothing leaves this device.",
                        tone: "ok",
                      })
                    }
                  >
                    Save locally
                  </AppButton>
                </Box>
                <Box gap="sm" bordered border="line" radius="lg" tint="raised" pad="lg" className="flex-1">
                  <AppText variant="small" weight={600}>Tones</AppText>
                  <AppText variant="micro" tone="muted">Status color is meaning, never decoration.</AppText>
                  <Box direction="row" gap="xs" wrap>
                    <StatusBadge tone="ok">Verified</StatusBadge>
                    <StatusBadge tone="err">Failed</StatusBadge>
                    <StatusBadge tone="warn">Pending</StatusBadge>
                    <StatusBadge tone="info">Syncing</StatusBadge>
                    <StatusBadge tone="neutral">Idle</StatusBadge>
                    <StatusBadge tone="accent">Live</StatusBadge>
                  </Box>
                  <Box direction="row" align="center" gap="sm">
                    <StatusDot tone="ok" pulse />
                    <AppText variant="small" tone="secondary">Transferring — 38 MB/s (placeholder shape, real numbers arrive in Phase 5)</AppText>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Section>
        </Container>
      </Main>
      <SiteFooter />

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        label="Transfer offer preview"
        title="Tayo's MacBook wants to send design.zip"
        description="2.4 GB · offer expires in 2 minutes · nothing is sent until you accept."
      >
        <Box gap="sm" className="pt-4">
          <AppButton label="Accept transfer" onClick={() => { setDialogOpen(false); notify({ title: "Accepted (preview)", message: "Phase 3 will start the real stream here.", tone: "ok" }); }}>
            Accept
          </AppButton>
          <AppButton label="Decline transfer" tone="secondary" onClick={() => setDialogOpen(false)}>
            Decline
          </AppButton>
        </Box>
      </Dialog>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </Box>
  );
}
