import { promises as fs } from "node:fs";
import path from "node:path";

export type Stage = {
  id: string;
  filename: string;
  size: number;
  stored: string;
  createdAt: number;
};

const STAGE_TTL = 30 * 60 * 1000;

function validId(id: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(id);
}

export function stageDir(): string {
  return path.join(process.cwd(), ".drift-staging");
}

function sidecar(id: string): string {
  return path.join(stageDir(), `${id}.json`);
}

/**
 * Stages live on disk as sidecar JSON, not in module memory: route
 * handlers and pages can run in separate module instances, and staged
 * files survive a server restart inside their TTL.
 */
export async function createStage(input: {
  id: string;
  filename: string;
  size: number;
  stored: string;
}): Promise<Stage> {
  const stage: Stage = { ...input, createdAt: Date.now() };
  await fs.writeFile(sidecar(stage.id), JSON.stringify(stage));
  void sweepDisk();
  console.log(`[stage ${stage.id}] "${stage.filename}" (${stage.size} bytes) ready for pickup`);
  return stage;
}

export async function getStage(id: string): Promise<Stage | undefined> {
  if (!validId(id)) return undefined;
  let stage: Stage;
  try {
    stage = JSON.parse(await fs.readFile(sidecar(id), "utf8")) as Stage;
  } catch {
    return undefined;
  }
  if (!stage || stage.id !== id || Date.now() - stage.createdAt > STAGE_TTL) {
    await removeStageFiles(id, stage?.stored).catch(() => null);
    return undefined;
  }
  return stage;
}

export async function deleteStage(id: string): Promise<boolean> {
  if (!validId(id)) return false;
  const stage = await getStage(id);
  if (!stage) return false;
  await removeStageFiles(id, stage.stored).catch(() => null);
  return true;
}

export function stageFilePath(stored: string): string {
  return path.join(stageDir(), path.basename(stored));
}

async function removeStageFiles(id: string, stored: string | undefined): Promise<void> {
  await fs.rm(sidecar(id), { force: true });
  if (stored) await fs.rm(stageFilePath(stored), { force: true });
}

async function sweepDisk(): Promise<void> {
  try {
    const names = await fs.readdir(stageDir());
    const now = Date.now();
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      try {
        const stage = JSON.parse(await fs.readFile(path.join(stageDir(), name), "utf8")) as Stage;
        if (now - stage.createdAt > STAGE_TTL) await removeStageFiles(stage.id, stage.stored);
      } catch {
        continue;
      }
    }
  } catch {
    return;
  }
}
