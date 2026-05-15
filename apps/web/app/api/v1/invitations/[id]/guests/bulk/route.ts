import { getServerSession } from "@/lib/session";
import { db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function resolveTenantAndInvitation(
  invitationId: string,
  userId: string,
  tenantSlug: string,
): Promise<{ tenantId: string } | null> {
  const [row] = await db
    .select({ tenantId: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, userId),
        eq(invitations.id, invitationId),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

const bulkDeleteSchema = z.object({
  guestIds: z.array(z.string().min(1)).min(1).max(500),
  tenantSlug: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { guestIds, tenantSlug } = parsed.data;

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const deleted = await db
    .delete(guests)
    .where(and(inArray(guests.id, guestIds), eq(guests.invitationId, id)))
    .returning({ id: guests.id });

  return NextResponse.json({ deleted: deleted.length });
}
