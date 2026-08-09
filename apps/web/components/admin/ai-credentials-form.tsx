"use client";

import { useState } from "react";

interface CredentialRow {
  provider: "anthropic" | "fal";
  configured: boolean;
  updatedAt: string | null;
}

const LABELS: Record<CredentialRow["provider"], string> = {
  anthropic: "Anthropic API Key (Claude)",
  fal: "fal.ai API Key (Flux Schnell)",
};

export function AiCredentialsForm({
  initialCredentials,
  canEdit,
}: { initialCredentials: CredentialRow[]; canEdit: boolean }) {
  const [rows, setRows] = useState(initialCredentials);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function handleSave(provider: CredentialRow["provider"]) {
    const apiKey = (inputs[provider] ?? "").trim();
    if (!apiKey) {
      setError(`${LABELS[provider]} tidak boleh kosong`);
      return;
    }
    setError(null);
    setSaved(null);
    setSaving(provider);
    try {
      const res = await fetch("/api/v1/admin/ai-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      }
      const data = (await res.json()) as { updatedAt: string };
      setRows((prev) =>
        prev.map((r) =>
          r.provider === provider ? { ...r, configured: true, updatedAt: data.updatedAt } : r,
        ),
      );
      setInputs((prev) => ({ ...prev, [provider]: "" }));
      setSaved(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(null);
    }
  }

  async function handleClear(provider: CredentialRow["provider"]) {
    setError(null);
    setSaved(null);
    setSaving(provider);
    try {
      const res = await fetch(`/api/v1/admin/ai-credentials?provider=${provider}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setRows((prev) =>
        prev.map((r) =>
          r.provider === provider ? { ...r, configured: false, updatedAt: null } : r,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      {rows.map((row) => (
        <div key={row.provider} className="space-y-1.5">
          <label htmlFor={`cred-${row.provider}`} className="text-sm font-medium">
            {LABELS[row.provider]}
          </label>
          <p className="text-xs text-muted-foreground">
            {row.configured ? "●●●● tersimpan" : "Belum diatur"}
            {row.configured && row.updatedAt
              ? ` · diperbarui ${new Date(row.updatedAt).toLocaleString("id-ID")}`
              : ""}
          </p>
          <div className="flex gap-2">
            <input
              id={`cred-${row.provider}`}
              type="password"
              autoComplete="off"
              placeholder={row.configured ? "Masukkan key baru untuk mengganti" : "sk-..."}
              value={inputs[row.provider] ?? ""}
              onChange={(e) => setInputs((prev) => ({ ...prev, [row.provider]: e.target.value }))}
              disabled={!canEdit}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
            {canEdit && (
              <button
                type="button"
                onClick={() => void handleSave(row.provider)}
                disabled={saving === row.provider}
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving === row.provider ? "..." : "Simpan"}
              </button>
            )}
          </div>
          {canEdit && row.configured && (
            <button
              type="button"
              onClick={() => void handleClear(row.provider)}
              disabled={saving === row.provider}
              className="text-xs text-destructive hover:underline disabled:opacity-60"
            >
              Hapus key
            </button>
          )}
          {saved === row.provider && <p className="text-sm text-emerald-600">Tersimpan.</p>}
        </div>
      ))}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
