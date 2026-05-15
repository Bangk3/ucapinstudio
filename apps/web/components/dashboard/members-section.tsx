"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string | null;
}

interface Props {
  tenantSlug: string;
  tenantId: string;
  currentUserId: string;
  currentUserRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Pemilik",
  admin: "Admin",
  editor: "Editor",
  viewer: "Peninjau",
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  editor: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-600",
};

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </td>
      <td className="px-4 py-3" />
    </tr>
  );
}

export function MembersSection({ tenantSlug, currentUserId, currentUserRole }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/v1/tenant/members?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      );
      if (!res.ok) throw new Error("Gagal memuat anggota");
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch {
      setFetchError("Gagal memuat daftar anggota");
    } finally {
      setLoadingMembers(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      const res = await fetch("/api/v1/tenant/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteError(data.error ?? "Gagal mengundang anggota");
        return;
      }
      setInviteSuccess(`${data.member.name || inviteEmail} berhasil diundang`);
      setInviteEmail("");
      await fetchMembers();
    } catch {
      setInviteError("Gagal terhubung ke server");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemoveError(null);
    setRemovingId(userId);
    try {
      const res = await fetch(
        `/api/v1/tenant/members/${userId}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRemoveError(data.error ?? "Gagal menghapus anggota");
        return;
      }
      await fetchMembers();
    } catch {
      setRemoveError("Gagal terhubung ke server");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <h2 className="font-semibold text-sm">Anggota Workspace</h2>

      {fetchError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {fetchError}
        </p>
      )}

      {/* Members table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Peran</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Bergabung</th>
              {currentUserRole === "owner" && (
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loadingMembers ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Belum ada anggota lain di workspace ini.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.userId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[member.role] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  {currentUserRole === "owner" && (
                    <td className="px-4 py-3">
                      {member.userId !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleRemove(member.userId)}
                          disabled={removingId === member.userId}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          aria-label={`Hapus ${member.name}`}
                        >
                          {removingId === member.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <X className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {removeError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {removeError}
        </p>
      )}

      {/* Invite form — only for owners/admins */}
      {canManage && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium">Undang Anggota</h3>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={inviting}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "editor" | "viewer")}
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={inviting}
              aria-label="Peran anggota baru"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Peninjau</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {inviting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {inviting ? "Mengundang..." : "Undang"}
            </button>
          </form>

          {inviteError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {inviteSuccess}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
