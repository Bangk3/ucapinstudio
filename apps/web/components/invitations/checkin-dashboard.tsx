"use client";

import { CheckCircle, Clock, QrCode, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface CheckinRow {
  id: string;
  guestId: string;
  guestName: string;
  guestCategory: string | null;
  checkedInAt: string;
  method: string;
}

interface Props {
  invitationId: string;
  tenantSlug: string;
  totalGuests: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 flex items-center gap-4 ${accent ? "bg-green-50 border-green-200" : "bg-card"}`}
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-green-100" : "bg-muted"}`}
      >
        <Icon
          className={`h-5 w-5 ${accent ? "text-green-600" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p
          className={`text-2xl font-bold tabular-nums leading-tight ${accent ? "text-green-700" : ""}`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function CheckinDashboard({ invitationId, tenantSlug, totalGuests }: Props) {
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const fetchCheckins = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/invitations/${invitationId}/checkins?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      );
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = (await res.json()) as { checkins: CheckinRow[] };
      setCheckins(data.checkins);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Gagal memuat data check-in");
    } finally {
      setLoading(false);
    }
  }, [invitationId, tenantSlug]);

  // Initial load + SSE for push (with polling fallback every 15s)
  useEffect(() => {
    fetchCheckins();

    // SSE connection for real-time updates
    const sse = new EventSource(
      `/api/v1/invitations/${invitationId}/checkins/sse?tenantSlug=${encodeURIComponent(tenantSlug)}`,
    );
    sseRef.current = sse;

    // Re-fetch on any SSE message (checkin event)
    sse.onmessage = () => {
      fetchCheckins();
    };

    // Polling fallback every 15s (SSE keep-alive pings don't trigger onmessage)
    const pollId = setInterval(fetchCheckins, 15_000);

    return () => {
      sse.close();
      clearInterval(pollId);
    };
  }, [invitationId, tenantSlug, fetchCheckins]);

  const total = checkins.length;
  const byCategory = checkins.reduce<Record<string, number>>((acc, c) => {
    const cat = c.guestCategory ?? "Umum";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const pct = totalGuests > 0 ? Math.round((total / totalGuests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-base">Dashboard Check-in</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {formatTime(lastRefresh.toISOString())}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchCheckins();
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
          <Link
            href={`/${tenantSlug}/dashboard/invitations/${invitationId}/checkin/scan`}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            Buka Scanner
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={CheckCircle}
          label="Sudah Check-in"
          value={loading ? "—" : total}
          accent
          {...(!loading ? { sub: `${pct}% dari tamu` } : {})}
        />
        <StatCard icon={Users} label="Total Tamu" value={totalGuests} />
        <StatCard
          icon={Clock}
          label="Belum Hadir"
          value={loading ? "—" : Math.max(0, totalGuests - total)}
          {...(!loading ? { sub: `${100 - pct}% dari tamu` } : {})}
        />
      </div>

      {/* Progress bar */}
      {!loading && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Kehadiran</span>
            <span className="tabular-nums font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {!loading && Object.keys(byCategory).length > 0 && (
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Per Kategori
          </p>
          <div className="space-y-1.5">
            {Object.entries(byCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{cat}</span>
                <span className="tabular-nums font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent checkins */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Check-in Terbaru
        </p>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : checkins.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <QrCode className="h-8 w-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Belum ada tamu yang check-in</p>
            <p className="text-xs text-muted-foreground mt-1">Gunakan scanner QR untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {checkins.slice(0, 50).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.guestName}</p>
                  {c.guestCategory && (
                    <p className="text-xs text-muted-foreground">{c.guestCategory}</p>
                  )}
                </div>
                <div className="shrink-0 text-right ml-3">
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatTime(c.checkedInAt)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.method === "qr" ? "QR" : "Manual"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
