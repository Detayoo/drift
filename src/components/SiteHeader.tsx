"use client";

import { IconArrowUpRight, IconCommand } from "@tabler/icons-react";
import Image from "next/image";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, AppHeader } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import type { Command } from "@/components/CommandPalette";
import { StatusBadge } from "@/components/Status";
import { ThemeToggle, useTheme } from "@/components/theme";
import { useToast } from "@/components/Toast";

/** Sticky product header. The command palette lives on the page (this bar's blur would trap a fixed overlay); the button just opens it. */
export function SiteHeader({ commands, onOpenPalette }: { commands: Command[]; onOpenPalette: () => void }) {
  return (
    <AppHeader className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <Container>
        <Box direction="row" align="center" justify="between" gap="md" className="h-16">
          <Box direction="row" align="center" gap="sm">
            <Image src="/icon.svg" width={32} height={32} alt="Drift" priority className="h-8 w-8" />
            <AppText variant="subheading" weight={600} className="text-[17px]">Drift</AppText>
            <Box className="max-md:hidden">
              <StatusBadge tone="neutral">Phase 4</StatusBadge>
            </Box>
          </Box>
          <Box direction="row" align="center" gap="sm">
            <ActionButton
              aria-label="Open command palette"
              onClick={onOpenPalette}
              className="h-10 gap-2 rounded-md border border-line bg-raised px-3.5 text-ink-2 transition-colors hover:bg-hover hover:text-ink"
            >
              <Icon icon={IconCommand} size={16} className="text-current" />
              <AppText variant="small" className="text-current max-md:hidden">Commands</AppText>
              <AppText variant="mono" tone="faint" className="max-md:hidden">⌘K</AppText>
            </ActionButton>
            <ThemeToggle />
          </Box>
        </Box>
      </Container>
    </AppHeader>
  );
}

export function useSiteCommands(scrollTo: (id: string) => void): Command[] {
  const { toggle } = useTheme();
  const { notify } = useToast();
  const focusDropzone = () => document.getElementById("dropzone")?.focus();
  return [
    { id: "theme", label: "Toggle theme", hint: "light / dark", icon: IconCommand, run: toggle },
    { id: "send", label: "Send a file", icon: IconArrowUpRight, run: () => { scrollTo("dropzone"); focusDropzone(); } },
    { id: "received", label: "View received files", icon: IconArrowUpRight, run: () => scrollTo("received") },
    {
      id: "status",
      label: "Copy build status",
      hint: "clipboard",
      icon: IconArrowUpRight,
      run: () => {
        void navigator.clipboard?.writeText("drift — Phase 4 nearby discovery with pickup links.").then(
          () => notify({ title: "Copied", message: "Build status is on your clipboard.", tone: "ok" }),
          () => notify({ title: "Copy failed", message: "Clipboard refused access.", tone: "err" }),
        );
      },
    },
  ];
}
