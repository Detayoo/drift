"use client";

import { IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { IconButton } from "@/components/IconButton";
import { fetchJson } from "@/lib/http";
import { shortId } from "@/lib/device";
import { useToast } from "@/components/Toast";

type TrustedRow = {
  id: string;
  name: string;
  addedAt: number;
};

/** Devices whose files arrive without asking. Revoking returns them to manual. */
export function TrustList({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [devices, setDevices] = useState<TrustedRow[]>([]);
  const { notify } = useToast();

  const refresh = useCallback(async () => {
    try {
      const body = await fetchJson<{ devices: TrustedRow[] }>("/api/trust");
      setDevices(body.devices);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  const revoke = async (id: string, name: string) => {
    try {
      await fetchJson(`/api/trust/${id}`, { method: "DELETE" });
      notify({ title: `Unpaired ${name || "device"}`, message: "Their files will ask first again.", tone: "ok" });
      onChanged();
    } catch {
      notify({ title: "Couldn't unpair", message: "Try again in a moment.", tone: "err" });
    }
  };

  if (devices.length === 0) {
    return (
      <AppText variant="micro" tone="muted">
        No paired devices yet — pairing skips the accept step between your machines.
      </AppText>
    );
  }

  return (
    <Box gap="xs">
      {devices.map((device) => (
        <Box
          key={device.id}
          direction="row"
          align="center"
          gap="sm"
          tint="sunken"
          bordered
          border="soft"
          radius="md"
          className="px-3.5 py-2.5"
        >
          <Box className="min-w-0 flex-1">
            <AppText variant="small" weight={600} truncate>{device.name || "Unnamed device"}</AppText>
            <AppText variant="mono" tone="faint">
              {shortId(device.id)} · paired {new Date(device.addedAt).toLocaleDateString()}
            </AppText>
          </Box>
          <IconButton
            icon={IconTrash}
            label={`Unpair ${device.name || "device"}`}
            onClick={() => {
              void revoke(device.id, device.name);
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
