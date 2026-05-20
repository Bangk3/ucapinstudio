"use client";

import { CheckCircle2, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CredentialRow {
  id: string;
  provider: "fonnte" | "whatsapp_cloud" | "smtp";
  isActive: boolean;
}

interface Props {
  tenantSlug: string;
}

export function MessagingCredentialsForm({ tenantSlug }: Props) {
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonnte form state
  const [fonnteToken, setFonnteToken] = useState("");
  const [fonnteDevice, setFonnteDevice] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fonnteConfigured = credentials.some((c) => c.provider === "fonnte");

  useEffect(() => {
    fetch(`/api/v1/tenant/messaging-credentials?tenantSlug=${tenantSlug}`)
      .then((r) => r.json())
      .then((d: { credentials: CredentialRow[] }) => setCredentials(d.credentials ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  async function handleSave() {
    setError(null);
    setSaveOk(false);
    if (!fonnteToken.trim()) {
      setError("Token Fonnte wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/tenant/messaging-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          provider: "fonnte",
          config: { apiKey: fonnteToken.trim(), deviceToken: fonnteDevice.trim() },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!res.ok || !data.ok) {
        setError("Gagal menyimpan. Periksa koneksi dan coba lagi.");
        return;
      }
      setSaveOk(true);
      setFonnteToken("");
      setFonnteDevice("");
      setCredentials((prev) =>
        prev.some((c) => c.provider === "fonnte")
          ? prev
          : [...prev, { id: "new", provider: "fonnte", isActive: true }],
      );
      setTimeout(() => setSaveOk(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus kredensial Fonnte? Broadcast via Fonnte akan berhenti.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/v1/tenant/messaging-credentials?tenantSlug=${tenantSlug}&provider=fonnte`, {
        method: "DELETE",
      });
      setCredentials((prev) => prev.filter((c) => c.provider !== "fonnte"));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="h-4 w-40 rounded bg-muted animate-pulse mb-4" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Integrasi WhatsApp — Fonnte</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Token API dari{" "}
            <a
              href="https://app.fonnte.com/devices"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              app.fonnte.com/devices
            </a>
          </p>
        </div>
        {fonnteConfigured && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Terkonfigurasi
          </span>
        )}
      </div>

      {error && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}
      {saveOk && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Kredensial Fonnte berhasil disimpan.
        </div>
      )}

      <div className="space-y-3">
        {/* Token */}
        <div>
          <label
            htmlFor="fonnte-token"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Token API Fonnte <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="fonnte-token"
              type={showToken ? "text" : "password"}
              value={fonnteToken}
              onChange={(e) => setFonnteToken(e.target.value)}
              placeholder={
                fonnteConfigured
                  ? "••••••••••••• (simpan ulang untuk update)"
                  : "Masukkan token API Fonnte"
              }
              className="w-full rounded-lg border bg-background px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showToken ? "Sembunyikan token" : "Tampilkan token"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Device (optional) */}
        <div>
          <label
            htmlFor="fonnte-device"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Nomor Perangkat{" "}
            <span className="text-muted-foreground/60 font-normal">
              (opsional — hanya untuk Fonnte Hub multi-device)
            </span>
          </label>
          <input
            id="fonnte-device"
            type="text"
            value={fonnteDevice}
            onChange={(e) => setFonnteDevice(e.target.value)}
            placeholder="6281234567890"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Format: angka saja, awalan 62 (tanpa +). Kosongkan jika single-device.
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !fonnteToken.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity hover:bg-primary/90"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Menyimpan..." : fonnteConfigured ? "Perbarui Token" : "Simpan"}
        </button>

        {fonnteConfigured && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-40 transition-colors"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Hapus
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground border-t pt-3">
        Token disimpan terenkripsi (AES-256-GCM). Tidak pernah ditampilkan kembali setelah disimpan.
      </p>
    </div>
  );
}
