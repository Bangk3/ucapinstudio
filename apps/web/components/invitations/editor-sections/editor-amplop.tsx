"use client";

import type { InvitationContent } from "@invyte/templates";
import { Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  content: InvitationContent;
  onChange: (patch: Partial<InvitationContent>) => void;
  tenantId: string;
}

type EWalletProvider = "gopay" | "ovo" | "dana" | "shopeepay" | "other";

const EWALLET_OPTIONS: Array<{ value: EWalletProvider; label: string }> = [
  { value: "gopay", label: "GoPay" },
  { value: "ovo", label: "OVO" },
  { value: "dana", label: "DANA" },
  { value: "shopeepay", label: "ShopeePay" },
  { value: "other", label: "Lainnya" },
];

export function EditorAmplop({ content, onChange, tenantId }: Props) {
  const amplop = content.amplop ?? {};
  const [qrisUploading, setQrisUploading] = useState(false);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  function patchAmplop(patch: Partial<NonNullable<InvitationContent["amplop"]>>) {
    onChange({ amplop: { ...amplop, ...patch } });
  }

  async function handleQrisUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setQrisUploading(true);
    setQrisError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("type", "image");

      const res = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setQrisError(body.error ?? "Upload gagal");
        return;
      }
      const data = (await res.json()) as { url: string };
      patchAmplop({ qrisUrl: data.url });
    } catch {
      setQrisError("Upload gagal, coba lagi");
    } finally {
      setQrisUploading(false);
    }
  }

  const bankAccounts = amplop.bankAccounts ?? [];
  const ewallets = amplop.ewallets ?? [];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Tampilkan informasi pembayaran hadiah digital kepada tamu (QRIS, transfer bank, e-wallet).
      </p>

      {/* QRIS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Kode QRIS</span>
          <button
            type="button"
            onClick={() => qrisInputRef.current?.click()}
            disabled={qrisUploading}
            className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors disabled:opacity-60"
          >
            <Upload className={`h-3 w-3 ${qrisUploading ? "animate-spin" : ""}`} />
            {qrisUploading ? "Mengupload..." : "Upload QRIS"}
          </button>
        </div>
        <input
          value={amplop.qrisUrl ?? ""}
          onChange={(e) => patchAmplop({ qrisUrl: e.target.value })}
          placeholder="https://... atau upload gambar QRIS di atas"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="URL gambar QRIS"
        />
        {qrisError && <p className="text-xs text-destructive">{qrisError}</p>}
        {amplop.qrisUrl && (
          <img
            src={amplop.qrisUrl}
            alt="Preview QRIS"
            className="mx-auto mt-2 h-32 w-32 rounded-xl object-contain border"
          />
        )}
        <input
          ref={qrisInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleQrisUpload}
          tabIndex={-1}
        />
        {amplop.qrisUrl && (
          <input
            value={amplop.qrisNote ?? ""}
            onChange={(e) => patchAmplop({ qrisNote: e.target.value })}
            placeholder="Catatan QRIS (opsional)"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Catatan QRIS"
          />
        )}
      </div>

      {/* Bank accounts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Rekening Bank</span>
          <button
            type="button"
            onClick={() =>
              patchAmplop({
                bankAccounts: [
                  ...bankAccounts,
                  { bankName: "", accountNumber: "", accountHolder: "" },
                ],
              })
            }
            className="flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            Tambah Rekening
          </button>
        </div>

        {bankAccounts.map((acc, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: bank accounts ordered by user
          <div key={idx} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Rekening {idx + 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  patchAmplop({ bankAccounts: bankAccounts.filter((_, i) => i !== idx) })
                }
                className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Hapus rekening ${idx + 1}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <input
              value={acc.bankName}
              onChange={(e) => {
                const next = [...bankAccounts];
                next[idx] = { ...acc, bankName: e.target.value };
                patchAmplop({ bankAccounts: next });
              }}
              placeholder="Nama Bank (BCA, Mandiri, BNI...)"
              className="w-full rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Nama bank ${idx + 1}`}
            />
            <input
              value={acc.accountNumber}
              onChange={(e) => {
                const next = [...bankAccounts];
                next[idx] = { ...acc, accountNumber: e.target.value };
                patchAmplop({ bankAccounts: next });
              }}
              placeholder="Nomor Rekening"
              className="w-full rounded border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Nomor rekening ${idx + 1}`}
            />
            <input
              value={acc.accountHolder}
              onChange={(e) => {
                const next = [...bankAccounts];
                next[idx] = { ...acc, accountHolder: e.target.value };
                patchAmplop({ bankAccounts: next });
              }}
              placeholder="Nama Pemilik Rekening"
              className="w-full rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Pemilik rekening ${idx + 1}`}
            />
          </div>
        ))}
        {bankAccounts.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-1">
            Belum ada rekening. Klik "Tambah Rekening".
          </p>
        )}
      </div>

      {/* E-wallets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">E-Wallet</span>
          <button
            type="button"
            onClick={() =>
              patchAmplop({
                ewallets: [...ewallets, { provider: "gopay", number: "", holder: "" }],
              })
            }
            className="flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            Tambah E-Wallet
          </button>
        </div>

        {ewallets.map((ew, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: ewallets ordered by user
          <div key={idx} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                E-Wallet {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => patchAmplop({ ewallets: ewallets.filter((_, i) => i !== idx) })}
                className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Hapus e-wallet ${idx + 1}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={ew.provider}
                onChange={(e) => {
                  const next = [...ewallets];
                  next[idx] = { ...ew, provider: e.target.value as EWalletProvider };
                  patchAmplop({ ewallets: next });
                }}
                className="flex-1 rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={`Provider e-wallet ${idx + 1}`}
              >
                {EWALLET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {ew.provider === "other" && (
                <input
                  value={ew.providerLabel ?? ""}
                  onChange={(e) => {
                    const next = [...ewallets];
                    next[idx] = { ...ew, providerLabel: e.target.value };
                    patchAmplop({ ewallets: next });
                  }}
                  placeholder="Nama Wallet"
                  className="flex-1 rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label={`Nama wallet lainnya ${idx + 1}`}
                />
              )}
            </div>
            <input
              value={ew.number}
              onChange={(e) => {
                const next = [...ewallets];
                next[idx] = { ...ew, number: e.target.value };
                patchAmplop({ ewallets: next });
              }}
              placeholder="Nomor / ID E-Wallet"
              className="w-full rounded border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Nomor e-wallet ${idx + 1}`}
            />
            <input
              value={ew.holder}
              onChange={(e) => {
                const next = [...ewallets];
                next[idx] = { ...ew, holder: e.target.value };
                patchAmplop({ ewallets: next });
              }}
              placeholder="Nama Pemilik"
              className="w-full rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={`Pemilik e-wallet ${idx + 1}`}
            />
          </div>
        ))}
        {ewallets.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-1">
            Belum ada e-wallet. Klik "Tambah E-Wallet".
          </p>
        )}
      </div>
    </div>
  );
}
