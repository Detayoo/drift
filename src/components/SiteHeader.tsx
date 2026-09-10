"use client";

import { IconArrowUpRight, IconCommand } from "@tabler/icons-react";
import { useState } from "react";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, AppHeader } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import { CommandPalette, usePaletteHotkey, type Command } from "@/components/CommandPalette";
import { StatusBadge } from "@/components/Status";
import { ThemeToggle, useTheme } from "@/components/theme";
import { useToast } from "@/components/Toast";

/** Sticky product header. Brand left, honest phase state + actions right. */
export function SiteHeader({ commands }: { commands: Command[] }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  usePaletteHotkey(() => setPaletteOpen(true));

  return (
    <AppHeader className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <Container>
        <Box direction="row" align="center" justify="between" gap="md" className="h-16">
          <Box direction="row" align="center" gap="sm">
            <Box align="center" justify="center" radius="md" tint="accent" className="h-8 w-8">
              <Icon icon={IconArrowUpRight} size={18} className="text-on-accent" />
            </Box>
            <AppText variant="subheading" weight={600} className="text-[17px]">LocalDrop</AppText>
            <Box className="max-md:hidden">
              <StatusBadge tone="neutral">Phase 0</StatusBadge>
            </Box>
          </Box>
          <Box direction="row" align="center" gap="sm">
            <ActionButton
              aria-label="Open command palette"
              onClick={() => setPaletteOpen(true)}
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
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </AppHeader>
  );
}

export function useSiteCommands(scrollTo: (id: string) => void): Command[] {
  const { toggle } = useTheme();
  const { notify } = useToast();
  return [
    { id: "theme", label: "Toggle theme", hint: "light / dark", icon: IconCommand, run: toggle },
    { id: "how", label: "Go to How it will work", icon: IconArrowUpRight, run: () => scrollTo("how") },
    { id: "principles", label: "Go to Principles", icon: IconArrowUpRight, run: () => scrollTo("principles") },
    { id: "roadmap", label: "Go to Build order", icon: IconArrowUpRight, run: () => scrollTo("roadmap") },
    { id: "system", label: "Go to Design system", icon: IconArrowUpRight, run: () => scrollTo("system") },
    {
      id: "status",
      label: "Copy build status",
      hint: "clipboard",
      icon: IconArrowUpRight,
      run: () => {
        void navigator.clipboard?.writeText("LocalDrop — Phase 0 foundation. Transfer engine not built yet.").then(
          () => notify({ title: "Copied", message: "Build status is on your clipboard.", tone: "ok" }),
          () => notify({ title: "Copy failed", message: "Clipboard refused access.", tone: "err" }),
        );
      },
    },
  ];
}
