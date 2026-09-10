import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocalDrop — Move files directly between your devices",
  description: "Local-first, device-to-device file transfer. No cloud. No account. Just your network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className={`${display.variable} ${sans.variable} ${mono.variable} flex min-h-full flex-col`}>
        <ThemeScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
