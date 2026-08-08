"use client";

import { useEffect, useState } from "react";

interface TopupRequestRow {
  request: {
    id: string;
    packageAmount: number;
    proofImageUrl: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
  };
  tenantName: string;
  tenantSlug: string;
  userEmail: string;
}

export function TopupQueue({ canApprove }: { canApprove: boolean }) {
  const [rows, setRows] = useState<TopupRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/topup-requests?status=pending");
    const data = (await res.json()) as { topupRequests: TopupRequestRow[] };
    setRows(data.topupRequests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    setError(null);
    setActioningId(id);
    const res = await fetch(`/api/v1/admin/topup-requests/${id}/approve`, { method: "POST" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(typeof body.error === "string" ? body.error : "Gagal memproses");
      setActioningId(null);
      return;
    }
    await load();
    setActioningId(null);
  }

  async function reject(id: string) {
    const reason = window.prompt("Alasan penolakan:");
    if (!reason) return;
    setError(null);
    setActioningId(id);
    const res = await fetch(`/api/v1/admin/topup-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(typeof body.error === "string" ? body.error : "Gagal memproses");
      setActioningId(null);
      return;
    }
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Tidak ada request pending.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows.map(({ request, tenantName, tenantSlug, userEmail }) => (
        <div key={request.id} className="rounded-xl border bg-card p-4 flex items-start gap-4">
          <img
            src={request.proofImageUrl}
            alt="Bukti transfer"
            className="h-20 w-20 rounded-lg object-cover border shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {tenantName} <span className="text-muted-foreground">({tenantSlug})</span>
            </p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
            <p className="text-sm mt-1">Rp {request.packageAmount.toLocaleString("id-ID")}</p>
          </div>
          {canApprove && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void approve(request.id)}
                disabled={actioningId === request.id}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void reject(request.id)}
                disabled={actioningId === request.id}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
