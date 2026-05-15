"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratis",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const TYPE_LABELS: Record<string, string> = {
  personal: "Personal",
  organization: "Organisasi",
  system: "System",
};

interface Props {
  tenantSlug: string;
  initialName: string;
  initialPrimaryColor: string;
  tenantType: string;
  plan: string;
}

export function TenantSettingsForm({
  tenantSlug,
  initialName,
  initialPrimaryColor,
  tenantType,
  plan,
}: Props) {
  const [name, setName] = useState(initialName);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || "#6366f1");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/v1/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          name: name.trim(),
          primaryColor: primaryColor || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Gagal menyimpan pengaturan");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Workspace info (read-only) */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Informasi Workspace</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Slug</p>
            <p className="font-mono font-medium">{tenantSlug}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipe</p>
            <p className="font-medium">{TYPE_LABELS[tenantType] ?? tenantType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Paket</p>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {PLAN_LABELS[plan] ?? plan}
            </span>
          </div>
        </div>
      </div>

      {/* Editable profile */}
      <form onSubmit={handleSave} className="rounded-xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold text-sm">Profil Workspace</h2>

        <div className="space-y-1.5">
          <label htmlFor="tenant-name" className="text-sm font-medium">
            Nama Workspace
          </label>
          <input
            id="tenant-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tenant-primary-color-text" className="text-sm font-medium">
            Warna Utama
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border bg-background p-1"
            />
            <input
              id="tenant-primary-color-text"
              type="text"
              value={primaryColor}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v);
              }}
              maxLength={7}
              placeholder="#6366f1"
              className="w-32 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div
              className="h-8 w-8 rounded-full border shadow-sm"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === "saved" ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saving ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : "Simpan"}
          </button>
          {saveStatus === "error" && (
            <span className="text-xs text-destructive">Gagal menyimpan</span>
          )}
        </div>
      </form>
    </div>
  );
}
