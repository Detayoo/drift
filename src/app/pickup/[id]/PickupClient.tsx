"use client";

import { IconDownload, IconFile } from "@tabler/icons-react";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, Main } from "@/components/primitives/Chrome";
import { Icon } from "@/components/primitives/Icon";
import { formatBytes } from "@/lib/upload";

/**
 * Browser pickup: one honest download button. Navigating straight to the
 * attachment URL keeps multi-gigabyte files out of JavaScript memory.
 */
export function PickupClient({
  filename,
  size,
  downloadUrl,
}: {
  filename: string;
  size: number;
  downloadUrl: string;
}) {
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
          <AppButton label={`Download ${filename}`} size="lg" iconLeft={IconDownload} onClick={() => window.location.assign(downloadUrl)}>
            Download
          </AppButton>
          <AppText variant="micro" tone="faint">Keep this tab open until it finishes.</AppText>
        </Box>
      </Container>
    </Main>
  );
}
