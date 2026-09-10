import Script from "next/script";

/** Pre-paint theme class — no flash. Server-safe. */
export function ThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem("drift-theme");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;
  return <Script id="drift-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: script }} />;
}
