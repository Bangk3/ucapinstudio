import { type Tenant, db, memberships, tenants } from "@invyte/db";
import { eq } from "drizzle-orm";
import { cache } from "react";

// React cache deduplicates per request
export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const result = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);

  return result[0] ?? null;
});

export async function getUserTenants(userId: string) {
  const rows = await db
    .select({ tenant: tenants, role: memberships.role })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.userId, userId));

  return rows;
}

export async function assertTenantMember(
  userId: string,
  tenantId: string,
): Promise<typeof memberships.$inferSelect> {
  const result = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);

  const membership = result.find((m) => m.tenantId === tenantId);
  if (!membership) throw new Error("FORBIDDEN");
  return membership;
}
