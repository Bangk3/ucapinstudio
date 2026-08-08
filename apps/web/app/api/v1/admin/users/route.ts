import { requireAdminSession } from "@/lib/require-admin";
import { memberships, tenants, user, withAdminDb } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const users = await withAdminDb((tx) => tx.select().from(user).orderBy(user.createdAt));

  const membershipRows = await withAdminDb((tx) =>
    tx
      .select({
        userId: memberships.userId,
        role: memberships.role,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id)),
  );

  const tenantsByUser = new Map<string, typeof membershipRows>();
  for (const row of membershipRows) {
    const list = tenantsByUser.get(row.userId) ?? [];
    list.push(row);
    tenantsByUser.set(row.userId, list);
  }

  const result = users.map((u) => ({
    ...u,
    tenants: tenantsByUser.get(u.id) ?? [],
  }));

  return NextResponse.json({ users: result });
}
