import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

const body = localFont({
  src: [
    { path: "./fonts/RebondGrotesque-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/RebondGrotesque-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/RebondGrotesque-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/RebondGrotesque-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const display = localFont({
  src: [{ path: "./fonts/TomatoGrotesk-Medium.otf", weight: "500", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocalDrop — Move files directly between your devices",
  description: "Local-first, device-to-device file transfer. No cloud. No account. Just your network.",
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
