import { deleteResume, readResumeView } from "@/server/resumable";
import path from "node:path";

export const STAGE_TTL_MS = 30 * 60 * 1000;

export function stageDir(): string {
  return path.join(process.cwd(), ".drift-staging");
}

export type StageInfo = {
  id: string;
  filename: string;
  size: number;
  stored: string;
  createdAt: number;
  expiresAt: number;
};

/** Only completed pickups resolve — half-staged files never get a page. */
export async function getStage(id: string): Promise<StageInfo | undefined> {
  const view = await readResumeView(stageDir(), id, STAGE_TTL_MS);
  if (!view.complete) return undefined;
  return {
    id,
    filename: view.complete.filename,
    size: view.complete.size,
    stored: `${id}-${view.complete.filename}`,
    createdAt: view.complete.createdAt,
    expiresAt: view.complete.createdAt + STAGE_TTL_MS,
  };
}

export async function deleteStage(id: string): Promise<boolean> {
  return deleteResume(stageDir(), id);
}
