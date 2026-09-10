"use client";

import { IconPencil } from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import { ActionButton } from "@/components/primitives/ActionButton";
import { AppText } from "@/components/primitives/AppText";
import { FieldInput } from "@/components/primitives/Fields";
import { Icon } from "@/components/primitives/Icon";

/**
 * Inline rename. Reads as plain text; activating it swaps in the field,
 * and blur or Enter commits while Escape cancels.
 */
export function InlineEdit({
  value,
  emptyText,
  label,
  maxLength = 40,
  onCommit,
}: {
  value: string;
  emptyText: string;
  label: string;
  maxLength?: number;
  onCommit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const settled = useRef(false);
  const selectOnMount = useCallback((el: HTMLInputElement | null) => {
    el?.select();
  }, []);

  if (!editing) {
    return (
      <ActionButton
        aria-label={`${label}: ${value || emptyText}. Activate to edit.`}
        onClick={() => {
          setDraft(value);
          settled.current = false;
          setEditing(true);
        }}
        className="group min-w-0 gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-hover"
      >
        <AppText variant="subheading" weight={600} truncate tone={value ? "default" : "muted"} className="min-w-0 flex-1">
          {value || emptyText}
        </AppText>
        <Icon icon={IconPencil} size={14} className="shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </ActionButton>
    );
  }

  const finish = (save: boolean) => {
    if (settled.current) return;
    settled.current = true;
    if (save) onCommit(draft);
    setEditing(false);
  };

  return (
    <FieldInput
      ref={selectOnMount}
      autoFocus
      aria-label={label}
      value={draft}
      maxLength={maxLength}
      placeholder={emptyText}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") finish(true);
        if (e.key === "Escape") finish(false);
      }}
      className="h-11 text-[16px] font-medium focus-visible:outline-none"
    />
  );
}
