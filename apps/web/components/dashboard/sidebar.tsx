"use client";

import { BarChart2, LayoutDashboard, Loader2, Plus, ScrollText, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

// Tamu and RSVP are managed per-invitation at:
//   /[tenant]/dashboard/invitations/[id]/guests
//   /[tenant]/dashboard/invitations/[id]/wishes
// They are accessed from the invitation list, not from top-level sidebar links.
const NAV_ITEMS = [
  { label: "Dasbor", href: "dashboard", icon: LayoutDashboard, exact: true },
  { label: "Undangan", href: "dashboard/invitations", icon: ScrollText },
  { label: "Analitik", href: "dashboard/analytics", icon: BarChart2 },
  { label: "Pengaturan", href: "dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  tenantSlug: string;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) {
      setSlug(toSlug(v));
    }
  }

  function handleSlugChange(v: string) {
    setSlugEdited(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (slug.length < 3) {
      setError("Slug minimal 3 karakter");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
      setError("Slug harus dimulai dan diakhiri huruf/angka");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          setError("Slug sudah digunakan");
        } else if (res.status === 422) {
          setError("Data tidak valid. Periksa kembali nama dan slug.");
        } else {
          setError(data.error ?? "Terjadi kesalahan");
        }
        return;
      }
      window.location.href = `/${data.tenant.slug}/dashboard`;
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        aria-hidden="true"
      />
      <dialog
        ref={dialogRef}
        open
        aria-label="Buat Workspace Baru"
        className="fixed inset-0 z-50 m-auto w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl space-y-4 mx-4 overflow-visible"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Buat Workspace Baru</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ws-name" className="text-sm font-medium">
              Nama Workspace
            </label>
            <input
              id="ws-name"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={255}
              placeholder="Wedding of Budi & Ani"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ws-slug" className="text-sm font-medium">
              Slug
            </label>
            <input
              id="ws-slug"
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              minLength={3}
              maxLength={48}
              placeholder="budi-ani"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            {slug && (
              <p className="text-xs text-muted-foreground">
                URL: <span className="font-mono">/{slug}</span>
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loading ? "Membuat..." : "Buat Workspace"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function DashboardSidebar({ tenantSlug }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <aside className="w-56 shrink-0 border-r bg-card flex flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-serif text-lg font-bold tracking-tight">Invyte</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const href = `/${tenantSlug}/${item.href}`;
            const active = item.exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-1">
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Buat Workspace Baru"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            Buat Workspace
          </button>
          <p className="px-3 text-xs text-muted-foreground truncate">{tenantSlug}</p>
        </div>
      </aside>

      {showDialog && <CreateWorkspaceDialog onClose={() => setShowDialog(false)} />}
    </>
  );
}
