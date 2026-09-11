import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";

// Usage: node scripts/bench-upload.mjs [baseUrl]
// Streams generated buffers at /api/transfers and reports throughput.
// Nothing is stored in memory: chunks are generated as they are sent.
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const SIZES_MB = [10, 100, 500];

function randomStream(total) {
  let left = total;
  return Readable.toWeb(
    new Readable({
      read(size) {
        if (left <= 0) {
          this.push(null);
          return;
        }
        const n = Math.min(size, left, 65536);
        left -= n;
        this.push(randomBytes(n));
      },
    }),
  );
}

for (const mb of SIZES_MB) {
  const size = mb * 1024 * 1024;
  const started = Date.now();
  const res = await fetch(`${base}/api/transfers`, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-drift-filename": `bench-${mb}mb.bin`,
      "x-drift-size": String(size),
      "x-drift-transfer": `bench-${mb}mb`,
      "x-drift-offset": "0",
    },
    body: randomStream(size),
    duplex: "half",
  });
  const ms = Date.now() - started;
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.bytes !== size) {
    console.error(`${mb}MB FAILED:`, body ?? res.status);
    process.exitCode = 1;
    break;
  }
  console.log(`${mb}MB in ${(ms / 1000).toFixed(1)}s — ${(mb / (ms / 1000)).toFixed(1)} MB/s`);
}
