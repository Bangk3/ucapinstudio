import { getServerSession } from "@/lib/session";
import {
  aiGenerations,
  creditTransactions,
  orders,
  tenants,
  topupRequests,
  withAdminDb,
} from "@invyte/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import Link from "next/link";

async function fetchOverview() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [revenueRow] = await withAdminDb((tx) =>
    tx
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(creditTransactions)
      .where(
        and(eq(creditTransactions.type, "topup"), gte(creditTransactions.createdAt, startOfMonth)),
      ),
  );
  const [orderRevenueRow] = await withAdminDb((tx) =>
    tx
      .select({ total: sql<string>`COALESCE(SUM(price), 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.reviewedAt, startOfMonth))),
  );
  const [activeTenantsRow] = await withAdminDb((tx) =>
    tx.select({ count: sql<string>`COUNT(*)` }).from(tenants).where(isNull(tenants.deletedAt)),
  );
  const [pendingTopupsRow] = await withAdminDb((tx) =>
    tx
      .select({ count: sql<string>`COUNT(*)` })
      .from(topupRequests)
      .where(eq(topupRequests.status, "pending")),
  );
  const [aiGenerationsRow] = await withAdminDb((tx) =>
    tx
      .select({ count: sql<string>`COUNT(*)` })
      .from(aiGenerations)
      .where(and(gte(aiGenerations.createdAt, startOfMonth), eq(aiGenerations.status, "done"))),
  );

  return {
    revenueThisMonth: Number(revenueRow?.total ?? 0) + Number(orderRevenueRow?.total ?? 0),
    activeTenants: Number(activeTenantsRow?.count ?? 0),
    pendingTopupRequests: Number(pendingTopupsRow?.count ?? 0),
    aiGenerationsThisMonth: Number(aiGenerationsRow?.count ?? 0),
  };
}

export default async function AdminOverviewPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  const isSuperadmin = role === "superadmin";

  const data = await fetchOverview();

  const cards = [
    { label: "Revenue Bulan Ini", value: `Rp ${data.revenueThisMonth.toLocaleString("id-ID")}` },
    { label: "Tenant Aktif", value: data.activeTenants.toString() },
    { label: "Top-Up Pending", value: data.pendingTopupRequests.toString() },
    { label: "AI Generation Bulan Ini", value: data.aiGenerationsThisMonth.toString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            isSuperadmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {role}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      {/* Actionable only for superadmin — admin can see the count above but can't approve */}
      {isSuperadmin && data.pendingTopupRequests > 0 && (
        <Link
          href="/admin/topup-requests"
          className="block rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary hover:bg-primary/10"
        >
          {data.pendingTopupRequests} top-up menunggu persetujuanmu →
        </Link>
      )}
    </div>
  );
}
