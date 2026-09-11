import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";

/**
 * Numbered editorial section header. The numeral is wayfinding (it
 * mirrors the docked rail order); the title carries the meaning.
 */
export function SectionHead({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body?: string;
}) {
  return (
    <Box gap="xs">
      <AppText variant="mono" tone="faint">{index}</AppText>
      <AppText variant="section" headingLevel={2}>{title}</AppText>
      {body ? (
        <AppText variant="body" tone="secondary" className="max-w-[56ch]">{body}</AppText>
      ) : null}
    </Box>
  );
}
