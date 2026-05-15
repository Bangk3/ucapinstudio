"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

interface Wish {
  id: string;
  senderName: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "spam";
  spamScore: number;
  createdAt: string;
}

interface WishesModerationProps {
  invitationId: string;
  tenantSlug: string;
  wishesModerated: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  spam: "Spam",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  spam: "bg-gray-100 text-gray-500",
};

export function WishesModeration({
  invitationId,
  tenantSlug,
  wishesModerated,
}: WishesModerationProps) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<string>("pending");
  const [moderating, setModerating] = useState<string | null>(null);

  const fetchWishes = useCallback(
    async (status: string) => {
      setLoading(true);
      const params = new URLSearchParams({ tenantSlug, limit: "100", offset: "0" });
      if (status) params.set("status", status);
      try {
        const res = await fetch(`/api/v1/invitations/${invitationId}/wishes?${params}`);
        const data = await res.json();
        setWishes(data.wishes ?? []);
        setTotal(data.total ?? 0);
        setLoaded(true);
      } finally {
        setLoading(false);
      }
    },
    [invitationId, tenantSlug],
  );

  if (!loaded && !loading) {
    fetchWishes(filter);
  }

  const handleFilter = (status: string) => {
    setFilter(status);
    fetchWishes(status);
  };

  const moderate = async (wishId: string, status: "approved" | "rejected" | "spam") => {
    setModerating(wishId);
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/wishes/${wishId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, tenantSlug }),
      });
      if (res.ok) {
        setWishes((prev) => prev.filter((w) => w.id !== wishId));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setModerating(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {!wishesModerated && (
        <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Moderasi otomatis nonaktif. Ucapan langsung tampil kecuali terdeteksi spam.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {["pending", "approved", "rejected", "spam"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleFilter(s)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === s
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[s] ?? s}
            {filter === s && total > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs text-brand-700">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Wish list */}
      {loading && <div className="py-12 text-center text-muted-foreground">Memuat ucapan...</div>}
      {!loading && wishes.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Tidak ada ucapan dengan status ini.
        </div>
      )}
      <div className="space-y-3">
        {wishes.map((wish) => (
          <div key={wish.id} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{wish.senderName}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[wish.status] ?? ""}`}
                  >
                    {STATUS_LABELS[wish.status] ?? wish.status}
                  </span>
                  {wish.spamScore > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                      <AlertTriangle className="h-3 w-3" />
                      Skor spam: {(wish.spamScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground break-words">{wish.message}</p>
                <p className="text-xs text-muted-foreground">{formatDate(wish.createdAt)}</p>
              </div>
              {wish.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => moderate(wish.id, "approved")}
                  disabled={moderating === wish.id}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="h-3 w-3" />
                  Setujui
                </button>
              )}
            </div>
            {wish.status !== "rejected" && wish.status !== "spam" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moderate(wish.id, "rejected")}
                  disabled={moderating === wish.id}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 hover:border-red-300 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Tolak
                </button>
                <button
                  type="button"
                  onClick={() => moderate(wish.id, "spam")}
                  disabled={moderating === wish.id}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Tandai Spam
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
