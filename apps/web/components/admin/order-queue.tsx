"use client";

import { useEffect, useState } from "react";

interface OrderRow {
  order: {
    id: string;
    customerName: string;
    price: number;
    paymentStatus: "pending" | "paid" | "rejected";
    proofImageUrl: string | null;
    invitationId: string | null;
  };
  tenantSlug: string;
}

export function OrderQueue({
  canApprove,
  refreshKey,
}: { canApprove: boolean; refreshKey: number }) {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/orders");
    const data = (await res.json()) as { orders: OrderRow[] };
    setRows(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [refreshKey]);

  async function approve(id: string) {
    setError(null);
    setActioningId(id);
    const res = await fetch(`/api/v1/admin/orders/${id}/approve`, { method: "POST" });
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
    const res = await fetch(`/api/v1/admin/orders/${id}/reject`, {
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

  async function createInvitation(id: string, tenantSlug: string) {
    setError(null);
    setActioningId(id);
    const res = await fetch(`/api/v1/admin/orders/${id}/create-invitation`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { invitation: { id: string } };
      window.location.href = `/${tenantSlug}/dashboard/invitations/${data.invitation.id}`;
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setError(typeof body.error === "string" ? body.error : "Gagal memproses");
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Belum ada order.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows.map(({ order, tenantSlug }) => (
        <div key={order.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">
              Rp {order.price.toLocaleString("id-ID")} ·{" "}
              {order.paymentStatus === "pending"
                ? "Menunggu"
                : order.paymentStatus === "paid"
                  ? "Lunas"
                  : "Ditolak"}
              {!order.proofImageUrl && order.paymentStatus === "pending"
                ? " · belum ada bukti"
                : ""}
            </p>
          </div>
          {canApprove && order.paymentStatus === "pending" && order.proofImageUrl && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void approve(order.id)}
                disabled={actioningId === order.id}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void reject(order.id)}
                disabled={actioningId === order.id}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
          {order.paymentStatus === "paid" && !order.invitationId && (
            <button
              type="button"
              onClick={() => void createInvitation(order.id, tenantSlug)}
              disabled={actioningId === order.id}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60 shrink-0"
            >
              Buat Undangan
            </button>
          )}
          {order.invitationId && (
            <a
              href={`/${tenantSlug}/dashboard/invitations/${order.invitationId}`}
              className="text-xs font-medium text-primary hover:underline shrink-0"
            >
              Buka Undangan
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
