"use client";

import type { Invitation } from "@invyte/db";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  invitation: Invitation;
  tenantSlug: string;
}

export function EditorSettings({ invitation, tenantSlug }: Props) {
  const router = useRouter();
  const [rsvpEnabled, setRsvpEnabled] = useState(invitation.rsvpEnabled);
  const [wishesEnabled, setWishesEnabled] = useState(invitation.wishesEnabled);
  const [wishesModerated, setWishesModerated] = useState(invitation.wishesModerated);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveSettings() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/v1/invitations/${invitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpEnabled, wishesEnabled, wishesModerated, tenantSlug }),
      });
      setSaveStatus(res.ok ? "success" : "error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/v1/invitations/${invitation.id}?tenantSlug=${tenantSlug}`, {
        method: "DELETE",
      });
      router.push(`/${tenantSlug}/dashboard/invitations`);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    const res = await fetch(`/api/v1/invitations/${invitation.id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug }),
    });
    if (res.ok) {
      const { invitation: copy } = (await res.json()) as { invitation: { id: string } };
      router.push(`/${tenantSlug}/dashboard/invitations/${copy.id}`);
    }
  }

  // Issue #4: no more oklch() inline styles — use Tailwind tokens
  function Toggle({
    label,
    checked,
    onChange,
  }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <div className="flex cursor-pointer items-center justify-between gap-3 py-0.5">
        <span className="text-sm">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
            checked ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ left: 4, transform: checked ? "translateX(20px)" : "translateX(0px)" }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border p-4">
        <Toggle label="RSVP aktif" checked={rsvpEnabled} onChange={setRsvpEnabled} />
        <Toggle label="Ucapan aktif" checked={wishesEnabled} onChange={setWishesEnabled} />
        {wishesEnabled && (
          <Toggle label="Moderasi ucapan" checked={wishesModerated} onChange={setWishesModerated} />
        )}

        {/* Issue #3: save feedback */}
        {saveStatus === "success" && (
          <output className="flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Pengaturan tersimpan
          </output>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-1.5 text-xs text-red-600" role="alert">
            <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Gagal menyimpan, coba lagi
          </div>
        )}

        {/* Issue #4: bg-primary instead of oklch() inline */}
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Link Undangan</p>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-xs truncate flex-1 font-mono">
            /{tenantSlug}/u/{invitation.slug}
          </span>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/${tenantSlug}/u/${invitation.slug}`,
              )
            }
            className="text-xs text-primary hover:underline shrink-0"
          >
            Salin
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleDuplicate}
          className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          Duplikat Undangan
        </button>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Hapus Undangan
          </button>
        ) : (
          <div className="rounded-lg border border-destructive/40 p-3 space-y-2">
            <p className="text-sm text-destructive font-medium">Yakin hapus undangan ini?</p>
            <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded border px-2 py-1.5 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded bg-destructive px-2 py-1.5 text-xs text-white disabled:opacity-60"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
