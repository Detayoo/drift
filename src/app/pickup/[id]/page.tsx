import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStage } from "@/server/stage";
import { PickupClient } from "./PickupClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const stage = await getStage((await params).id);
  return { title: stage ? `Pick up ${stage.filename} — Drift` : "Pickup expired — Drift" };
}

export default async function PickupPage({ params }: { params: Promise<{ id: string }> }) {
  const stage = await getStage((await params).id);
  if (!stage) notFound();
  return <PickupClient filename={stage.filename} size={stage.size} downloadUrl={`/api/stage/${stage.id}/file`} expiresAt={stage.expiresAt} />;
}
