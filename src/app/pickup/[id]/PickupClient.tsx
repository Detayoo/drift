"use client";

import { IconDownload, IconFile } from "@tabler/icons-react";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, Main } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import { formatBytes } from "@/lib/upload";
import { useCountdown } from "@/hooks/useCountdown";

/**
 * Browser pickup: one honest download button. Navigating straight to the
 * attachment URL keeps multi-gigabyte files out of JavaScript memory.
 */
export function PickupClient({
  filename,
  size,
  downloadUrl,
  expiresAt,
}: {
  filename: string;
  size: number;
  downloadUrl: string;
  expiresAt: number;
}) {
  const countdown = useCountdown(expiresAt);
  return (
    <Main>
      <Container>
        <Box align="center" justify="center" gap="md" className="py-24 text-center">
          <Box align="center" justify="center" radius="lg" bordered border="line" tint="raised" className="h-16 w-16">
            <Icon icon={IconFile} size={28} className="text-ink" />
          </Box>
          <AppText variant="micro" tone="faint">shared with you over local Wi-Fi</AppText>
          <AppText variant="heading" headingLevel={1} className="max-w-[20ch] break-words">{filename}</AppText>
          <AppText variant="body" tone="secondary">{formatBytes(size)} · direct from their machine, nothing in between.</AppText>
          {countdown.expired ? (
            <AppText variant="body" tone="err">This link has expired. Ask them to share a new one.</AppText>
          ) : (
            <Box gap="md" align="center" className="text-center">
              <AppButton label={`Download ${filename}`} size="lg" iconLeft={IconDownload} onClick={() => window.location.assign(downloadUrl)}>
                Download
              </AppButton>
              <AppText variant="micro" tone="faint">Link expires in {countdown.label} · keep this tab open until it finishes.</AppText>
            </Box>
          )}
        </Box>
      </Container>
    </Main>
  );
}
