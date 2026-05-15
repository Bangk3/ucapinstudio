"use client";

import { Check, Copy, Download, Trash2, Upload, UserPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: string;
  slug: string;
  openCount: number;
  openedAt: string | null;
}

interface GuestListProps {
  invitationId: string;
  invitationSlug: string;
  tenantSlug: string;
  initialCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  family: "Keluarga",
  friends: "Teman",
  colleagues: "Rekan",
  school: "Sekolah",
  community: "Komunitas",
  vip: "VIP",
  other: "Lainnya",
};

const CATEGORY_COLORS: Record<string, string> = {
  family: "bg-blue-100 text-blue-700",
  friends: "bg-green-100 text-green-700",
  colleagues: "bg-yellow-100 text-yellow-700",
  school: "bg-purple-100 text-purple-700",
  community: "bg-orange-100 text-orange-700",
  vip: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-600",
};

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  const color = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title="Salin tautan"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

export function GuestList({
  invitationId,
  invitationSlug,
  tenantSlug,
  initialCount,
}: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add guest form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    phone: "",
    email: "",
    category: "other",
    notes: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchGuests = useCallback(
    async (s?: string, cat?: string) => {
      setLoading(true);
      const params = new URLSearchParams({ tenantSlug, limit: "100", offset: "0" });
      if (s) params.set("search", s);
      if (cat) params.set("category", cat);
      try {
        const res = await fetch(`/api/v1/invitations/${invitationId}/guests?${params}`);
        const data = await res.json();
        setGuests(data.guests ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [invitationId, tenantSlug],
  );

  // Load on mount (client-only — relative URL needs browser context)
  useEffect(() => {
    fetchGuests(search || undefined, category || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchGuests(search, category);
  };

  const handleDelete = async (guestId: string) => {
    if (!confirm("Hapus tamu ini?")) return;
    const res = await fetch(
      `/api/v1/invitations/${invitationId}/guests/${guestId}?tenantSlug=${tenantSlug}`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) {
      alert("Gagal menghapus tamu. Silakan coba lagi.");
      return;
    }
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    setTotal((prev) => prev - 1);
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newGuest, tenantSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error?.message ?? "Gagal menambah tamu");
        return;
      }
      setGuests((prev) => [data.guest, ...prev]);
      setTotal((prev) => prev + 1);
      setNewGuest({ name: "", phone: "", email: "", category: "other", notes: "" });
      setShowAddForm(false);
    } finally {
      setAddLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(
        `/api/v1/invitations/${invitationId}/guests/import?tenantSlug=${tenantSlug}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) {
        await fetchGuests(search, category);
      }
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    window.location.href = `/api/v1/invitations/${invitationId}/guests/export?tenantSlug=${tenantSlug}`;
  };

  const guestLink = (slug: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/${tenantSlug}/u/${invitationSlug}/${slug}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Tamu
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
          <Upload className="h-4 w-4" />
          {importLoading ? "Mengimpor..." : "Import CSV"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImport}
          />
        </label>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <span className="ml-auto text-sm text-muted-foreground">{total} tamu</span>
      </div>

      {/* Import result */}
      {importResult && (
        <div
          className={`rounded-md p-3 text-sm ${importResult.errors.length > 0 ? "bg-yellow-50 text-yellow-800" : "bg-green-50 text-green-800"}`}
        >
          {importResult.imported} tamu berhasil diimpor.
          {importResult.errors.length > 0 && (
            <span>
              {" "}
              {importResult.errors.length} baris gagal:{" "}
              {importResult.errors
                .slice(0, 3)
                .map((e) => `baris ${e.row}: ${e.reason}`)
                .join("; ")}
              {importResult.errors.length > 3 ? "..." : ""}
            </span>
          )}
        </div>
      )}

      {/* Add guest form */}
      {showAddForm && (
        <form onSubmit={handleAddGuest} className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Tambah Tamu Baru</h3>
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="new-guest-name" className="block text-xs font-medium mb-1">
                Nama *
              </label>
              <input
                id="new-guest-name"
                type="text"
                required
                maxLength={255}
                value={newGuest.name}
                onChange={(e) => setNewGuest((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Nama tamu"
              />
            </div>
            <div>
              <label htmlFor="new-guest-phone" className="block text-xs font-medium mb-1">
                Nomor HP
              </label>
              <input
                id="new-guest-phone"
                type="tel"
                maxLength={20}
                value={newGuest.phone}
                onChange={(e) => setNewGuest((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="+628..."
              />
            </div>
            <div>
              <label htmlFor="new-guest-email" className="block text-xs font-medium mb-1">
                Email
              </label>
              <input
                id="new-guest-email"
                type="email"
                maxLength={255}
                value={newGuest.email}
                onChange={(e) => setNewGuest((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <label htmlFor="new-guest-category" className="block text-xs font-medium mb-1">
                Kategori
              </label>
              <select
                id="new-guest-category"
                value={newGuest.category}
                onChange={(e) => setNewGuest((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="new-guest-notes" className="block text-xs font-medium mb-1">
              Catatan
            </label>
            <input
              id="new-guest-notes"
              type="text"
              value={newGuest.notes}
              onChange={(e) => setNewGuest((p) => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Opsional"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addLoading}
              className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {addLoading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          placeholder="Cari nama tamu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            fetchGuests(search, e.target.value);
          }}
          className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Semua Kategori</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Cari
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Kategori</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nomor HP</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Tautan Personal
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Dibuka</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && guests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada tamu. Tambah tamu atau import CSV.
                </td>
              </tr>
            )}
            {guests.map((guest) => (
              <tr key={guest.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{guest.name}</td>
                <td className="px-4 py-3">
                  <CategoryBadge category={guest.category} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{guest.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <CopyButton text={guestLink(guest.slug)} />
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{guest.openCount}x</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(guest.id)}
                    className="inline-flex items-center rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Hapus tamu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
