"use client";

import { useEffect, useState } from "react";

interface DeviceBreakdown {
  device: string | null;
  count: number;
}

interface DailyView {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueVisitors: number;
  };
  deviceBreakdown: DeviceBreakdown[];
  dailyViews: DailyView[];
}

interface Props {
  invitationId: string;
  tenantSlug: string;
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function AnalyticsDashboard({ invitationId, tenantSlug }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      `/api/v1/invitations/${invitationId}/analytics?tenantSlug=${encodeURIComponent(tenantSlug)}`,
    )
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Gagal memuat data analitik");
        }
        return res.json() as Promise<AnalyticsData>;
      })
      .then((d) => setData(d))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      })
      .finally(() => setLoading(false));
  }, [invitationId, tenantSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 animate-pulse">
            <div className="h-3 w-24 rounded bg-muted mb-3" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 gap-3">
        <p className="font-medium text-destructive">Gagal memuat analitik</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, deviceBreakdown, dailyViews } = data;
  const hasViews = summary.totalViews > 0;

  // Avg views/day over last 30 days
  const avgPerDay = dailyViews.length > 0 ? Math.round(summary.totalViews / 30) : 0;

  // Device breakdown total for percentage
  const deviceTotal = deviceBreakdown.reduce((acc, d) => acc + Number(d.count), 0);

  if (!hasViews) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total Kunjungan" value="0" />
          <KpiCard label="Pengunjung Unik" value="0" />
          <KpiCard label="Rata-rata/Hari" value="0" />
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 gap-3">
          <p className="font-medium">Belum ada kunjungan</p>
          <p className="text-sm text-muted-foreground">
            Data akan muncul setelah undangan dibuka oleh tamu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Kunjungan" value={summary.totalViews.toLocaleString("id-ID")} />
        <KpiCard label="Pengunjung Unik" value={summary.uniqueVisitors.toLocaleString("id-ID")} />
        <KpiCard label="Rata-rata/Hari" value={avgPerDay.toLocaleString("id-ID")} />
      </div>

      {/* Device Breakdown */}
      {deviceBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Perangkat</h2>
          <div className="space-y-3">
            {deviceBreakdown.map((d) => {
              const label = d.device ?? "unknown";
              const pct = deviceTotal > 0 ? (Number(d.count) / deviceTotal) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-muted-foreground capitalize">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Views Table */}
      {dailyViews.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Kunjungan Harian (30 Hari Terakhir)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Tanggal
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Kunjungan
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Unik</th>
                </tr>
              </thead>
              <tbody>
                {[...dailyViews].reverse().map((row) => (
                  <tr
                    key={row.date}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(row.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {Number(row.views).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {Number(row.uniqueVisitors).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
