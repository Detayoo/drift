"use client";

import { IconCloudUpload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { FieldInput } from "@/components/primitives/Fields";
import { Icon } from "@/components/primitives/Icon";

/**
 * File drop target with click-to-browse and full keyboard support.
 * Emits the chosen file; validation lives with the caller.
 */
export function DropZone({
  onFile,
  disabled = false,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <Box
      role="button"
      label="Choose a file to send"
      tabIndex={disabled ? undefined : 0}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && !disabled) onFile(file);
      }}
      align="center"
      justify="center"
      gap="sm"
      bordered
      border="field"
      radius="lg"
      tint={dragging ? "hover" : "raised"}
      className={`border-dashed px-6 py-14 text-center transition-colors max-md:py-10 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <Icon icon={IconCloudUpload} size={32} className={dragging ? "text-accent" : "text-ink-3"} />
      <AppText variant="subheading" weight={600}>
        {dragging ? "Let go to send it" : "Drop a file here"}
      </AppText>
      <AppText variant="small" tone="secondary">
        or focus and press Enter to browse — it never leaves this machine
      </AppText>
      <FieldInput
        ref={inputRef}
        type="file"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
        className="hidden"
      />
    </Box>
  );
}
