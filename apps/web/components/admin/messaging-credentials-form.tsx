"use client";

import { useState } from "react";

interface ProviderStatus {
  provider: "whatsapp_cloud" | "fonnte";
  configured: boolean;
  updatedAt: string | null;
}

const FIELDS: Record<
  ProviderStatus["provider"],
  { key: string; label: string; required: boolean }[]
> = {
  whatsapp_cloud: [
    { key: "phoneNumberId", label: "Phone Number ID", required: true },
    { key: "accessToken", label: "Access Token", required: true },
    { key: "businessAccountId", label: "Business Account ID (opsional)", required: false },
  ],
  fonnte: [
    { key: "apiKey", label: "Token Fonnte", required: true },
    { key: "deviceToken", label: "Device Token (opsional)", required: false },
  ],
};

const TITLES: Record<ProviderStatus["provider"], string> = {
  whatsapp_cloud: "WhatsApp Cloud API",
  fonnte: "Fonnte",
};

function ProviderCard({
  status,
  canEdit,
}: {
  status: ProviderStatus;
  canEdit: boolean;
}) {
  const fields = FIELDS[status.provider];
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [configured, setConfigured] = useState(status.configured);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const config: Record<string, string> = {};
      for (const f of fields) {
        const v = (values[f.key] ?? "").trim();
        if (f.required && !v) throw new Error(`${f.label} wajib diisi`);
        if (v) config[f.key] = v;
      }
      const res = await fetch("/api/v1/admin/messaging-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: status.provider, config }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      }
      setSaved(true);
      setConfigured(true);
      setValues(Object.fromEntries(fields.map((f) => [f.key, ""])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/messaging-credentials?provider=${status.provider}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setConfigured(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{TITLES[status.provider]}</h2>
        <span
          className={`text-xs rounded-full px-2 py-0.5 ${
            configured ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {configured ? "●●●● tersimpan" : "Belum diatur"}
        </span>
      </div>

      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label htmlFor={`${status.provider}-${f.key}`} className="text-sm font-medium">
            {f.label}
          </label>
          <input
            id={`${status.provider}-${f.key}`}
            type="password"
            autoComplete="off"
            placeholder={configured ? "●●●●●●●●" : ""}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            disabled={!canEdit}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
      ))}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {saved && <p className="text-sm text-emerald-600">Tersimpan.</p>}

      {canEdit && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          {configured && (
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MessagingCredentialsForm({
  initialStatus,
  canEdit,
}: { initialStatus: ProviderStatus[]; canEdit: boolean }) {
  return (
    <div className="space-y-4">
      {initialStatus.map((status) => (
        <ProviderCard key={status.provider} status={status} canEdit={canEdit} />
      ))}
    </div>
  );
}
