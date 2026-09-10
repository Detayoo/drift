export type DeviceIdentity = {
  id: string;
  name: string;
};

const ID_KEY = "drift-device-id";
const NAME_KEY = "drift-device-name";
const MAX_NAME = 40;

/** Stable per-browser device id. Created once, kept forever. */
export function getDeviceId(): string {
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 4).toUpperCase();
}

export function getDeviceName(): string {
  return (window.localStorage.getItem(NAME_KEY) ?? "").trim();
}

export function setDeviceName(name: string): string {
  const clean = name.trim().slice(0, MAX_NAME);
  if (clean) window.localStorage.setItem(NAME_KEY, clean);
  else window.localStorage.removeItem(NAME_KEY);
  return clean;
}

export function displayName(fallback = "This device"): string {
  return getDeviceName() || fallback;
}
