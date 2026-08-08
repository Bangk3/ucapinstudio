import { requireAdminSession } from "@/lib/require-admin";
import {
  aiGenerations,
  creditTransactions,
  orders,
  tenants,
  topupRequests,
  withAdminDb,
} from "@invyte/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

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

  return NextResponse.json({
    revenueThisMonth: Number(revenueRow?.total ?? 0) + Number(orderRevenueRow?.total ?? 0),
    activeTenants: Number(activeTenantsRow?.count ?? 0),
    pendingTopupRequests: Number(pendingTopupsRow?.count ?? 0),
    aiGenerationsThisMonth: Number(aiGenerationsRow?.count ?? 0),
  });
}
