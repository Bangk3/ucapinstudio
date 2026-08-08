import { requireAdminSession } from "@/lib/require-admin";
import { creditTransactions, tenants, withAdminDb } from "@invyte/db";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const typeFilter = req.nextUrl.searchParams.get("type");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);

  const rows = await withAdminDb((tx) => {
    const base = tx
      .select({
        transaction: creditTransactions,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(creditTransactions)
      .innerJoin(tenants, eq(creditTransactions.tenantId, tenants.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);

    return typeFilter
      ? base.where(
          eq(
            creditTransactions.type,
            typeFilter as "topup" | "debit_ai_generation" | "debit_template_unlock",
          ),
        )
      : base;
  });

  return NextResponse.json({ transactions: rows });
}
