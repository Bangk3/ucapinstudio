"use client";

import { useEffect, useState } from "react";

type Role = "user" | "admin" | "superadmin";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  banned: boolean;
  tenants: { tenantName: string; tenantSlug: string; role: string }[];
}

const ROLES: Role[] = ["user", "admin", "superadmin"];
const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  admin: "Admin",
  superadmin: "Superadmin",
};

export function UserTable({
  canModerate,
  currentUserId,
}: { canModerate: boolean; currentUserId: string }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    await fetch(`/api/v1/admin/users/${id}/${banned ? "unban" : "ban"}`, { method: "POST" });
    await load();
    setActioningId(null);
  }

  async function changeRole(id: string, role: Role) {
    setActioningId(id);
    setError(null);
    const res = await fetch(`/api/v1/admin/users/${id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(typeof data.error === "string" ? data.error : "Gagal mengubah role");
    }
    await load();
    setActioningId(null);
  }

  async function deleteUser(id: string, name: string) {
    if (
      !confirm(`Hapus akun "${name}"? Akun akan langsung ter-banned dan tidak bisa login lagi.`)
    ) {
      return;
    }
    setActioningId(id);
    setError(null);
    const res = await fetch(`/api/v1/admin/users/${id}/delete`, { method: "POST" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(typeof data.error === "string" ? data.error : "Gagal menghapus user");
    }
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {canModerate && <th className="px-4 py-2 font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    {u.name}
                    {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(kamu)</span>}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {u.tenants.map((t) => t.tenantSlug).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2">
                    {canModerate && !isSelf ? (
                      <select
                        value={u.role}
                        onChange={(e) => void changeRole(u.id, e.target.value as Role)}
                        disabled={actioningId === u.id}
                        className="rounded-lg border bg-background px-2 py-1 text-xs disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
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
                      {!isSelf && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => void toggleBan(u.id, u.banned)}
                            disabled={actioningId === u.id}
                            className="rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-60"
                          >
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteUser(u.id, u.name)}
                            disabled={actioningId === u.id}
                            className="rounded-lg border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
