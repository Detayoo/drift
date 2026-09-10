/**
 * Pairing without typing. A receiver shares `base/?connect=<url>&name=<name>`;
 * the sender opening it gets the destination prefilled and named.
 */

export function normalizeDeviceUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Enter the other device's address first.");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("That address must start with http:// or https://.");
  }
  return url.origin;
}

export function buildInviteLink(base: string, name: string): string {
  const query = new URLSearchParams({ connect: base });
  if (name.trim()) query.set("name", name.trim().slice(0, 40));
  return `${base.replace(/\/+$/, "")}/?${query.toString()}`;
}

export function parseInvite(search: string): { address: string; name: string | null } | null {
  const query = new URLSearchParams(search);
  const raw = query.get("connect");
  if (!raw) return null;
  try {
    return { address: normalizeDeviceUrl(raw), name: query.get("name")?.slice(0, 40) || null };
  } catch {
    return null;
  }
}
