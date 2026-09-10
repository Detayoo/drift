/**
 * JSON API calls. Every request carries a timeout so a stalled network
 * becomes an error state with retry — never an endless spinner.
 * Binary uploads stream through lib/upload.ts and never use this.
 */

export async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `${fallback} (HTTP ${res.status}).`;
}

export async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 10000, ...rest } = init ?? {};
  const res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(await readError(res, "Request failed"));
  return (await res.json()) as T;
}

export function isNetworkFailure(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError");
}
