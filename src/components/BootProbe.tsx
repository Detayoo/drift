import Script from "next/script";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";

const probe = [
  "(function(){",
  "var show=function(){var el=document.getElementById('drift-boot-error');if(el){el.style.display='flex';}};",
  "window.addEventListener('error',function(e){if(e.target!==window)return;if(!window.__drift_ok)show();},true);",
  "window.addEventListener('unhandledrejection',function(){if(!window.__drift_ok)show();});",
  "setTimeout(function(){if(!window.__drift_ok)show();},10000);",
  "})();",
].join("");

/**
 * Startup watchdog. If client JavaScript never boots (failed chunks,
 * crashed hydration), the static loading shell would spin forever —
 * this banner says so instead. Providers sets the ok flag on mount.
 */
export function BootProbe() {
  return (
    <>
      <Box
        id="drift-boot-error"
        role="alert"
        className="fixed inset-x-0 top-0 z-[200] hidden justify-center border-b border-err bg-err-bg px-4 py-3"
      >
        <AppText variant="small" tone="err" weight={600}>
          Drift didn&apos;t start. Close this tab and open the address again.
        </AppText>
      </Box>
      <Script id="drift-boot-probe" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: probe }} />
    </>
  );
}
