"use client";

import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Wish {
  id: string;
  senderName: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "spam";
  spamScore: number | null;
  createdAt: Date;
}

interface WishRowProps {
  wish: Wish;
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
  rejected: "bg-red-100 text-red-600",
  spam: "bg-gray-100 text-gray-500",
};

export function WishRow({ wish, invitationId, tenantSlug, wishesModerated }: WishRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(wish.status);
  const [moderating, setModerating] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const moderate = async (nextStatus: "approved" | "rejected" | "spam") => {
    setModerating(nextStatus);
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/wishes/${wish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, tenantSlug }),
      });
      if (res.ok) {
        setStatus(nextStatus);
        // If filtered view (not "Semua"), remove row after brief delay
        if (window.location.search.includes("status=")) {
          setTimeout(() => {
            setDone(true);
            router.refresh();
          }, 600);
        } else {
          router.refresh();
        }
      }
    } finally {
      setModerating(null);
    }
  };

  if (done) return null;

  const busy = moderating !== null;

  return (
    <div
      className={`rounded-lg border bg-card px-4 py-3 space-y-3 transition-opacity duration-300 ${done ? "opacity-0" : "opacity-100"}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{wish.senderName}</p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${STATUS_COLORS[status] ?? ""}`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
            {(wish.spamScore ?? 0) > 0.3 && (
              <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Skor spam: {((wish.spamScore ?? 0) * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground break-words">{wish.message}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(wish.createdAt).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Action buttons — only in moderated mode */}
      {wishesModerated && (
        <div className="flex flex-wrap gap-2 pt-1 border-t">
          {/* Approve — hidden when already approved */}
          {status !== "approved" && (
            <button
              type="button"
              onClick={() => moderate("approved")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors min-h-[32px]"
            >
              {moderating === "approved" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Setujui
            </button>
          )}

          {/* Reject — hidden when already rejected */}
          {status !== "rejected" && (
            <button
              type="button"
              onClick={() => moderate("rejected")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 transition-colors min-h-[32px]"
            >
              {moderating === "rejected" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Tolak
            </button>
          )}

          {/* Spam — hidden when already spam */}
          {status !== "spam" && (
            <button
              type="button"
              onClick={() => moderate("spam")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground disabled:opacity-50 transition-colors min-h-[32px]"
            >
              {moderating === "spam" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Spam
            </button>
          )}
        </div>
      )}
    </div>
  );
}
