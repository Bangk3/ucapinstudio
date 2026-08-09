"use client";

import { useRef, useState } from "react";

interface Props {
  tenantSlug: string;
  tenantId: string;
  topupPackages: [number, number, number];
  bankInfo: string | null;
  qrisInfo: string | null;
}

export function TopupForm({ tenantSlug, tenantId, topupPackages, bankInfo, qrisInfo }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<number>(topupPackages[0]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Upload bukti transfer terlebih dahulu");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("type", "image");

      const uploadRes = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const body = (await uploadRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Upload bukti transfer gagal");
      }
      const { url } = (await uploadRes.json()) as { url: string };

      setUploading(false);
      setSubmitting(true);

      const res = await fetch("/api/v1/tenant/topup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, packageAmount: selectedPackage, proofImageUrl: url }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Gagal mengirim permintaan top-up");
      }

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">Permintaan top-up terkirim.</p>
        <p className="text-muted-foreground mt-1">
          Menunggu verifikasi admin. Saldo akan otomatis bertambah setelah disetujui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Pilih Paket</p>
        <div className="grid grid-cols-3 gap-2">
          {topupPackages.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setSelectedPackage(amount)}
              className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ${
                selectedPackage === amount
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              Rp {amount.toLocaleString("id-ID")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
        <p className="font-medium">Transfer ke:</p>
        {bankInfo || qrisInfo ? (
          <>
            {bankInfo && <p className="text-muted-foreground whitespace-pre-line">{bankInfo}</p>}
            {qrisInfo && <p className="text-muted-foreground whitespace-pre-line">{qrisInfo}</p>}
          </>
        ) : (
          <p className="text-muted-foreground">
            Info pembayaran belum diatur admin. Hubungi kami sebelum transfer.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="proof-upload" className="text-sm font-medium">
          Bukti Transfer
        </label>
        <input
          id="proof-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || submitting}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Mengunggah bukti..." : submitting ? "Mengirim..." : "Kirim Permintaan Top-Up"}
      </button>
    </div>
  );
}
