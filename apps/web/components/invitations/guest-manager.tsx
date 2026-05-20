"use client";

import {
  Check,
  Copy,
  Download,
  Loader2,
  Plus,
  QrCode,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  family: "Keluarga",
  friends: "Teman",
  colleagues: "Rekan Kerja",
  school: "Teman Sekolah",
  community: "Komunitas",
  vip: "VIP",
  other: "Lainnya",
};

interface Guest {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  category: string;
  slug: string;
  plusOneAllowed: boolean;
}

interface Props {
  invitationId: string;
  invitationSlug: string;
  tenantSlug: string;
  initialGuests: Guest[];
  initialTotal: number;
}

export function GuestManager({
  invitationId,
  invitationSlug,
  tenantSlug,
  initialGuests,
  initialTotal,
}: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [total, setTotal] = useState(initialTotal);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Add guest form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    category: "other",
    plusOneAllowed: false,
    notes: "",
  });

  /**
   * Build display-name map: when same name appears 2+ times in the guest list,
   * append a disambiguator suffix.
   *   - Has phone → "Budi (•••• 7890)"
   *   - No phone → "Budi #2", "Budi #3"
   * Pure derived state (no extra fetch).
   */
  const displayNames = (() => {
    const nameGroups = new Map<string, Guest[]>();
    for (const g of guests) {
      const key = g.name.trim().toLowerCase();
      const arr = nameGroups.get(key) ?? [];
      arr.push(g);
      nameGroups.set(key, arr);
    }
    const result = new Map<string, string>();
    for (const group of nameGroups.values()) {
      if (group.length === 1) {
        const g = group[0];
        if (g) result.set(g.id, g.name);
        continue;
      }
      // Same-name collision: disambiguate
      let nextSequence = 1;
      for (const g of group) {
        const digits = (g.phone ?? "").replace(/\D/g, "");
        if (digits.length >= 4) {
          result.set(g.id, `${g.name} (•••• ${digits.slice(-4)})`);
        } else {
          result.set(g.id, nextSequence === 1 ? g.name : `${g.name} #${nextSequence}`);
          nextSequence++;
        }
      }
    }
    return result;
  })();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          category: form.category,
          plusOneAllowed: form.plusOneAllowed,
          notes: form.notes.trim() || undefined,
          tenantSlug,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        // Duplicate-phone error includes a friendlier `message` field
        throw new Error(j.message ?? j.error ?? "Gagal menambah tamu");
      }
      const { guest } = await res.json();
      setGuests((prev) => [...prev, guest]);
      setTotal((prev) => prev + 1);
      setForm({
        name: "",
        phone: "",
        email: "",
        category: "other",
        plusOneAllowed: false,
        notes: "",
      });
      setShowAddForm(false);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setAdding(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/v1/invitations/${invitationId}/guests/import?tenantSlug=${tenantSlug}`,
        { method: "POST", body: fd },
      );
      const j = await res.json();
      setImportResult({ imported: j.imported ?? 0, errors: j.errors ?? [] });
      if (j.imported > 0) {
        // Refresh guest list
        const listRes = await fetch(
          `/api/v1/invitations/${invitationId}/guests?tenantSlug=${tenantSlug}&limit=200`,
        );
        if (listRes.ok) {
          const data = await listRes.json();
          setGuests(data.guests ?? []);
          setTotal(data.total ?? 0);
        }
      }
    } catch {
      setImportResult({ imported: 0, errors: [{ row: 0, reason: "Gagal mengimpor file" }] });
    } finally {
      setImporting(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function copyLink(guest: Guest) {
    const url = `${window.location.origin}/${tenantSlug}/u/${invitationSlug}/${guest.slug}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedSlug(guest.slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  async function refetch() {
    const res = await fetch(
      `/api/v1/invitations/${invitationId}/guests?tenantSlug=${tenantSlug}&limit=200`,
    );
    if (res.ok) {
      const data = await res.json();
      setGuests(data.guests ?? []);
      setTotal(data.total ?? 0);
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Hapus ${selectedIds.size} tamu? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/guests/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: Array.from(selectedIds), tenantSlug }),
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setSelectedIds(new Set());
      await refetch();
    } catch {
      alert("Gagal menghapus tamu");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Tamu
        </button>

        <a
          href={`/api/v1/invitations/${invitationId}/guests/template`}
          download="tamu-template.csv"
          className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Unduh Template
        </a>

        <label
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium cursor-pointer hover:bg-accent transition-colors ${importing ? "opacity-60 pointer-events-none" : ""}`}
        >
          <Upload className="h-4 w-4" />
          {importing ? "Mengimpor..." : "Impor CSV"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>

        <a
          href={`/api/v1/invitations/${invitationId}/guests/qr-zip`}
          download={`qr-${invitationId}.zip`}
          className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
        >
          <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
          Unduh QR ZIP
        </a>

        <a
          href={`/api/v1/invitations/${invitationId}/guests/export?tenantSlug=${tenantSlug}`}
          className="ml-auto flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Ekspor CSV
        </a>
      </div>

      {/* CSV format hint */}
      <p className="text-xs text-muted-foreground">
        Format CSV:{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          nama, telepon, email, kategori, catatan
        </code>{" "}
        — baris pertama boleh header.
      </p>

      {/* Import result */}
      {importResult && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${importResult.errors.length === 0 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-800"}`}
        >
          <p className="font-medium">{importResult.imported} tamu berhasil diimpor.</p>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs">
              {importResult.errors.slice(0, 5).map((e) => (
                <li key={`${e.row}-${e.reason}`}>
                  Baris {e.row}: {e.reason}
                </li>
              ))}
              {importResult.errors.length > 5 && (
                <li>…dan {importResult.errors.length - 5} kesalahan lainnya.</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Add guest inline form */}
      {showAddForm && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Tambah Tamu Baru</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="gm-guest-name" className="text-xs font-medium">
                  Nama <span className="text-destructive">*</span>
                </label>
                <input
                  id="gm-guest-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="cth. Budi Santoso"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="gm-guest-category" className="text-xs font-medium">
                  Kategori
                </label>
                <select
                  id="gm-guest-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="gm-guest-phone" className="text-xs font-medium">
                  Telepon
                </label>
                <input
                  id="gm-guest-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="cth. 08123456789"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="gm-guest-email" className="text-xs font-medium">
                  Email
                </label>
                <input
                  id="gm-guest-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="cth. budi@email.com"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="gm-guest-notes" className="text-xs font-medium">
                Catatan
              </label>
              <input
                id="gm-guest-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Catatan internal..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.plusOneAllowed}
                onChange={(e) => setForm((f) => ({ ...f, plusOneAllowed: e.target.checked }))}
                className="h-4 w-4 rounded border"
              />
              Boleh membawa plus-one
            </label>
            {addError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {addError}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {adding ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk delete bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5">
          <span className="text-sm font-medium text-destructive">
            {selectedIds.size} tamu dipilih
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors disabled:opacity-60"
          >
            {bulkDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            )}
            Hapus Dipilih
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkDeleting}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* Guest list */}
      {guests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 gap-3">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada tamu</p>
          <p className="text-sm text-muted-foreground">
            Tambahkan tamu satu per satu atau impor via CSV.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua"
                    checked={selectedIds.size === guests.length && guests.length > 0}
                    ref={(el) => {
                      if (el)
                        el.indeterminate = selectedIds.size > 0 && selectedIds.size < guests.length;
                    }}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(guests.map((g) => g.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Link Personal
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-muted/30 transition-colors">
                  <td className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${guest.name}`}
                      checked={selectedIds.has(guest.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(guest.id);
                        else next.delete(guest.id);
                        setSelectedIds(next);
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{displayNames.get(guest.id) ?? guest.name}</p>
                    {guest.phone && <p className="text-xs text-muted-foreground">{guest.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">
                    {CATEGORY_LABELS[guest.category] ?? guest.category}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/${tenantSlug}/u/${invitationSlug}/${guest.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-mono"
                    >
                      /{guest.slug} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <a
                        href={`/api/v1/invitations/${invitationId}/guests/${guest.id}/qr`}
                        download={`qr-${guest.slug}.png`}
                        className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Unduh QR code"
                        aria-label={`Unduh QR code untuk ${guest.name}`}
                      >
                        <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyLink(guest)}
                        title="Salin link undangan"
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {copiedSlug === guest.slug ? (
                          <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
            {total} tamu terdaftar
          </div>
        </div>
      )}
    </div>
  );
}
