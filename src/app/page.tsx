import type { Metadata } from "next";
import { HomeScreen } from "@/screens/Home";

export const metadata: Metadata = {
  title: "LocalDrop — Move files directly between your devices",
  description: "Local-first, device-to-device file transfer. No cloud. No account. Just your network.",
};

export default function Page() {
  return <HomeScreen />;
}
