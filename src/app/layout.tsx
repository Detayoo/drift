import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/Providers";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

const body = localFont({
  src: [
    { path: "./fonts/PPMori-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/PPMori-SemiBold.otf", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "./fonts/Iosevka-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Iosevka-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Iosevka-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

const display = localFont({
  src: [{ path: "./fonts/TomatoGrotesk-Medium.otf", weight: "500", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drift — Move files directly between your devices",
  description: "Local-first, device-to-device file transfer. No cloud. No account. Just your network.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-full flex-col`}>
        <ThemeScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
