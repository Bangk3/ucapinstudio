"use client";

import { useState } from "react";

export function OrderForm({ onCreated }: { onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!customerName.trim() || !customerContact.trim()) {
      setError("Nama dan kontak customer wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerContact: customerContact.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof body.error === "string" ? body.error : "Gagal membuat order");
      }
      const data = (await res.json()) as { publicUrl: string };
      setPublicUrl(data.publicUrl);
      setCustomerName("");
      setCustomerContact("");
      setNotes("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <p className="font-medium text-sm">Buat Order Baru</p>
      <input
        placeholder="Nama customer"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
      <input
        placeholder="Kontak (nomor WA)"
        value={customerContact}
        onChange={(e) => setCustomerContact(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Catatan (opsional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitting ? "Membuat..." : "Buat Order"}
      </button>

      {publicUrl && (
        <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2">
          <code className="text-xs flex-1 truncate">{publicUrl}</code>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-md border px-2 py-1 text-xs font-medium shrink-0"
          >
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>
      )}
    </div>
  );
}
