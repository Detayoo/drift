import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { Container, AppFooter, Divider } from "@/components/primitives/Chrome";

/** Quiet footer. States the deal: local-first, no cloud, no account. */
export function SiteFooter() {
  return (
    <AppFooter className="mt-24">
      <Divider />
      <Container>
        <Box direction="row" align="center" justify="between" gap="sm" className="py-8 max-md:flex-col max-md:items-start max-md:pb-28">
          <AppText variant="micro" tone="muted">Drift — move files directly between your devices.</AppText>
          <AppText variant="mono" tone="faint">no cloud · no account · phase 4</AppText>
        </Box>
      </Container>
    </AppFooter>
  );
}
