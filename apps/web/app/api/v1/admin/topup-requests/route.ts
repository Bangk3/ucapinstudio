import { requireAdminSession } from "@/lib/require-admin";
import { tenants, topupRequests, user, withAdminDb } from "@invyte/db";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const statusFilter = req.nextUrl.searchParams.get("status");

  const rows = await withAdminDb((tx) => {
    const base = tx
      .select({
        request: topupRequests,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        userEmail: user.email,
      })
      .from(topupRequests)
      .innerJoin(tenants, eq(topupRequests.tenantId, tenants.id))
      .innerJoin(user, eq(topupRequests.userId, user.id))
      .orderBy(desc(topupRequests.createdAt));

    return statusFilter
      ? base.where(eq(topupRequests.status, statusFilter as "pending" | "approved" | "rejected"))
      : base;
  });

  return NextResponse.json({ topupRequests: rows });
}
