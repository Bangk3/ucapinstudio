"use client";

import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  tenants: { tenantName: string; tenantSlug: string; role: string }[];
}

export function UserTable({ canModerate }: { canModerate: boolean }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/users");
    const data = (await res.json()) as { users: UserRow[] };
    setRows(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleBan(id: string, banned: boolean) {
    setActioningId(id);
    await fetch(`/api/v1/admin/users/${id}/${banned ? "unban" : "ban"}`, { method: "POST" });
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Nama</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Tenant</th>
            <th className="px-4 py-2 font-medium">Status</th>
            {canModerate && <th className="px-4 py-2 font-medium">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {u.tenants.map((t) => t.tenantSlug).join(", ") || "—"}
              </td>
              <td className="px-4 py-2">
                {u.banned ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    Banned
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    Aktif
                  </span>
                )}
              </td>
              {canModerate && (
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => void toggleBan(u.id, u.banned)}
                    disabled={actioningId === u.id}
                    className="rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-60"
                  >
                    {u.banned ? "Unban" : "Ban"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
