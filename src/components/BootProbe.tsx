import Script from "next/script";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";

const probe = [
  "(function(){",
  "var show=function(){var el=document.getElementById('drift-boot-error');if(el){el.style.display='flex';}};",
  "window.__drift_errs=0;",
  "var report=function(m){if(window.__drift_errs>=3)return;window.__drift_errs++;try{fetch(\"/api/client-errors\",{method:\"POST\",headers:{\"content-type\":\"application/json\"},body:JSON.stringify({message:String(m).slice(0,300),where:location.pathname})});}catch(e){}};",
  "window.addEventListener('error',function(e){if(e.target!==window)return;report(e.message||'error');if(!window.__drift_ok)show();},true);",
  "window.addEventListener('unhandledrejection',function(e){var r=e.reason;report(r&&r.message?r.message:r);if(!window.__drift_ok)show();});",
  "setTimeout(function(){if(!window.__drift_ok)show();},10000);",
  "})();",
].join("");

/**
 * Startup watchdog + failure beacon. If client JavaScript never boots
 * (failed chunks, crashed hydration), the static loading shell would spin
 * forever — this banner says so instead, and every client error is also
 * reported to /api/client-errors so it lands in the server log.
 * Providers sets the ok flag on mount.
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
