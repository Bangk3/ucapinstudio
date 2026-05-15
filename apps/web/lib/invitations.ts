import { db, invitations } from "@invyte/db";
import type { Invitation } from "@invyte/db";
import { and, desc, eq, isNull } from "drizzle-orm";

export type { Invitation };

export async function listInvitations(tenantId: string) {
  return db
    .select()
    .from(invitations)
    .where(and(eq(invitations.tenantId, tenantId), isNull(invitations.deletedAt)))
    .orderBy(desc(invitations.createdAt));
}

export async function getInvitation(tenantId: string, id: string) {
  const [row] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.id, id),
        eq(invitations.tenantId, tenantId),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getInvitationBySlug(tenantId: string, slug: string) {
  const [row] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.slug, slug),
        eq(invitations.tenantId, tenantId),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function slugExists(tenantId: string, slug: string, excludeId?: string) {
  const conditions = [
    eq(invitations.tenantId, tenantId),
    eq(invitations.slug, slug),
    isNull(invitations.deletedAt),
  ];
  const rows = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(and(...conditions));
  return rows.some((r) => r.id !== excludeId);
}
