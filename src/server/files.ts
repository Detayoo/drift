import { createWriteStream } from "node:fs";
import { PassThrough, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/**
 * Shared streaming write. Source streams through, bytes are counted as
 * they pass, and the whole file is never in memory. Returns bytes kept.
 */
export async function streamToFile(
  source: Readable,
  dest: string,
  onBytes?: (received: number) => void,
  opts?: { append?: boolean },
): Promise<number> {
  let received = 0;
  const tap = new PassThrough();
  tap.on("data", (chunk: Buffer) => {
    received += chunk.length;
    onBytes?.(received);
  });
  await pipeline(source, tap, createWriteStream(dest, { flags: opts?.append ? "a" : "w" }));
  return received;
}
