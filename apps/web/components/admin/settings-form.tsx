"use client";

import { useState } from "react";

interface SettingRow {
  key: string;
  value: number | null;
  valueText?: string | null;
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

const TEXT_KEY = "admin_whatsapp_number";
const TEXT_LABEL = 'Nomor WA Admin — CTA "Dibuatin Admin aja" (628xxxxxxxxxx)';

const TEXT_FIELDS: {
  key: string;
  label: string;
  placeholder?: string;
  validate?: (v: string) => string | null;
  multiline?: boolean;
}[] = [
  {
    key: "support_email",
    label: "Email Support (footer)",
    placeholder: "support@ucapinstudio.com",
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Email tidak valid"),
  },
  {
    key: "social_instagram",
    label: "Link Instagram (footer)",
    placeholder: "https://instagram.com/...",
  },
  {
    key: "social_twitter",
    label: "Link Twitter/X (footer)",
    placeholder: "https://twitter.com/...",
  },
  {
    key: "payment_bank_info",
    label: "Info Rekening Bank (form top-up & order)",
    placeholder: "BCA 1234567890 a.n. UcapinStudio",
    multiline: true,
  },
  {
    key: "payment_qris_info",
    label: "Info QRIS / Pembayaran Lain",
    placeholder: "Scan QRIS di aplikasi e-wallet apapun",
    multiline: true,
  },
];

const FLAG_FIELDS: { key: string; label: string }[] = [
  { key: "feature_ai_enabled", label: "AI Generation aktif" },
  { key: "feature_messaging_enabled", label: "Messaging (WA/Email) aktif" },
];

export function SettingsForm({
  initialSettings,
  canEdit,
}: { initialSettings: SettingRow[]; canEdit: boolean }) {
  const allTextKeys = new Set<string>([TEXT_KEY, ...TEXT_FIELDS.map((f) => f.key)]);
  const flagKeys = new Set<string>(FLAG_FIELDS.map((f) => f.key));

  const [values, setValues] = useState<Record<string, string>>(() => {
    const fromRows = Object.fromEntries(
      initialSettings.map((s) => [
        s.key,
        allTextKeys.has(s.key) ? (s.valueText ?? "") : String(s.value ?? ""),
      ]),
    );
    // Feature flags default to "enabled" when the row doesn't exist yet
    // (fresh DB) — matches getFeatureFlags()'s default-true behavior.
    for (const key of flagKeys) {
      if (!(key in fromRows)) fromRows[key] = "1";
    }
    return fromRows;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const body: Record<string, number | string> = {};
      for (const key of ORDER) {
        const n = Number(values[key]);
        if (!Number.isInteger(n) || n <= 0) {
          throw new Error(`${LABELS[key]} harus berupa angka positif`);
        }
        body[key] = n;
      }
      const waNumber = (values[TEXT_KEY] ?? "").trim();
      if (waNumber) {
        if (!/^[0-9]{8,15}$/.test(waNumber)) {
          throw new Error(`${TEXT_LABEL} harus angka saja, 8-15 digit`);
        }
        body[TEXT_KEY] = waNumber;
      }
      for (const field of TEXT_FIELDS) {
        const v = (values[field.key] ?? "").trim();
        if (!v) continue;
        const err = field.validate?.(v);
        if (err) throw new Error(`${field.label}: ${err}`);
        body[field.key] = v;
      }
      for (const field of FLAG_FIELDS) {
        body[field.key] = values[field.key] === "1" ? 1 : 0;
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

      <div className="space-y-1.5">
        <label htmlFor={`setting-${TEXT_KEY}`} className="text-sm font-medium">
          {TEXT_LABEL}
        </label>
        <input
          id={`setting-${TEXT_KEY}`}
          type="text"
          inputMode="numeric"
          placeholder="6281234567890"
          value={values[TEXT_KEY] ?? ""}
          onChange={(e) => setValues((prev) => ({ ...prev, [TEXT_KEY]: e.target.value }))}
          disabled={!canEdit}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
        />
      </div>

      {TEXT_FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label htmlFor={`setting-${field.key}`} className="text-sm font-medium">
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              id={`setting-${field.key}`}
              rows={2}
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              disabled={!canEdit}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          ) : (
            <input
              id={`setting-${field.key}`}
              type="text"
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              disabled={!canEdit}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          )}
        </div>
      ))}

      <div className="space-y-2 pt-2">
        <p className="text-sm font-medium">Feature Kill Switches</p>
        {FLAG_FIELDS.map((field) => (
          <label
            key={field.key}
            htmlFor={`setting-${field.key}`}
            className="flex items-center gap-2 text-sm"
          >
            <input
              id={`setting-${field.key}`}
              type="checkbox"
              checked={values[field.key] === "1"}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.checked ? "1" : "0" }))
              }
              disabled={!canEdit}
              className="h-4 w-4 disabled:opacity-60"
            />
            {field.label}
          </label>
        ))}
      </div>

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
