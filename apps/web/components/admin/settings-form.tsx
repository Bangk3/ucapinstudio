"use client";

import { useState } from "react";

interface SettingRow {
  key: string;
  value: number;
}

const LABELS: Record<string, string> = {
  ai_generation_cost: "Biaya AI Generate (Rp)",
  template_unlock_cost: "Biaya Unlock Template (Rp)",
  order_package_price: 'Harga Paket "Dibuatkan" (Rp)',
  topup_package_1: "Paket Top-Up 1 (Rp)",
  topup_package_2: "Paket Top-Up 2 (Rp)",
  topup_package_3: "Paket Top-Up 3 (Rp)",
};

const ORDER = [
  "ai_generation_cost",
  "template_unlock_cost",
  "order_package_price",
  "topup_package_1",
  "topup_package_2",
  "topup_package_3",
];

export function SettingsForm({
  initialSettings,
  canEdit,
}: { initialSettings: SettingRow[]; canEdit: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSettings.map((s) => [s.key, String(s.value)])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const body: Record<string, number> = {};
      for (const key of ORDER) {
        const n = Number(values[key]);
        if (!Number.isInteger(n) || n <= 0) {
          throw new Error(`${LABELS[key]} harus berupa angka positif`);
        }
        body[key] = n;
      }

      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      {ORDER.map((key) => (
        <div key={key} className="space-y-1.5">
          <label htmlFor={`setting-${key}`} className="text-sm font-medium">
            {LABELS[key]}
          </label>
          <input
            id={`setting-${key}`}
            type="number"
            min={1}
            value={values[key] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
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
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      )}
    </div>
  );
}
