"use client";

import { IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { FieldInput } from "@/components/primitives/Fields";
import { Icon } from "@/components/primitives/Icon";
import type { TablerIcon } from "@tabler/icons-react";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: TablerIcon;
  run: () => void;
};

/** Global ⌘K / Ctrl+K listener. */
export function usePaletteHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

/**
 * Command palette foundation. Every command is real — nothing decorative.
 * Full keyboard support: arrows cycle, Enter runs, Escape closes.
 */
export function CommandPalette({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open ]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => setActive(0), [matches.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const close = () => onOpenChange(false);

  return (
    <Box role="dialog" label="Command palette" className="fixed inset-0 z-50 flex justify-center px-4 pt-[12vh]">
      <Box onClick={close} className="fixed inset-0 cursor-default bg-overlay" />
      <Box bordered border="line" radius="lg" tint="raised" className="relative max-h-[60dvh] w-full max-w-[36rem] overflow-hidden">
        <Box direction="row" align="center" gap="sm" className="border-b border-line px-4">
          <Icon icon={IconSearch} size={18} className="text-ink-3" />
          <FieldInput
            role="combobox"
            aria-expanded="true"
            aria-controls="drift-commands"
            aria-activedescendant={matches[active] ? `cmd-${matches[active].id}` : undefined}
            aria-label="Type a command"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (matches.length ? (a + 1) % matches.length : 0)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (matches.length ? (a - 1 + matches.length) % matches.length : 0)); }
              if (e.key === "Enter") { const cmd = matches[active]; if (cmd) { close(); cmd.run(); } }
              if (e.key === "Escape") close();
            }}
            placeholder="Type a command"
            className="h-14 border-0 bg-transparent px-0 text-[15px] focus:border-transparent focus-visible:outline-none"
          />
        </Box>
        <Box role="listbox" id="drift-commands" label="Commands" className="max-h-[40dvh] overflow-y-auto p-2">
          {matches.length === 0 ? (
            <Box pad="lg" align="center">
              <AppText variant="small" tone="muted">No matching command</AppText>
            </Box>
          ) : (
            matches.map((cmd, i) => (
              <Box
                key={cmd.id}
                id={`cmd-${cmd.id}`}
                role="option"
                aria-selected={i === active}
                direction="row"
                align="center"
                gap="sm"
                radius="md"
                onClick={() => { close(); cmd.run(); }}
                onHover={() => setActive(i)}
                className={`cursor-pointer px-3 py-2.5 ${i === active ? "bg-hover" : "bg-transparent"}`}
              >
                <Icon icon={cmd.icon} size={18} className="text-ink-2" />
                <AppText variant="small" weight={500} truncate className="flex-1">{cmd.label}</AppText>
                {cmd.hint ? (
                  <AppText variant="mono" tone="faint">{cmd.hint}</AppText>
                ) : null}
              </Box>
            ))
          )}
        </Box>
        <Box direction="row" gap="md" className="border-t border-line-soft px-4 py-2.5">
          <AppText variant="micro" tone="faint">↑↓ navigate</AppText>
          <AppText variant="micro" tone="faint">↵ run</AppText>
          <AppText variant="micro" tone="faint">esc close</AppText>
        </Box>
      </Box>
    </Box>
  );
}
