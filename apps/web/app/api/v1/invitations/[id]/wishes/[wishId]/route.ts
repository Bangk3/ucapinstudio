import { getServerSession } from "@/lib/session";
import { db, invitations, memberships, tenants, wishes } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
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

const moderateSchema = z.object({
  status: z.enum(["approved", "rejected", "spam"]),
  tenantSlug: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string; wishId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, wishId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = moderateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, status } = parsed.data;

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [existing] = await db
    .select({ id: wishes.id, invitationId: wishes.invitationId })
    .from(wishes)
    .where(eq(wishes.id, wishId))
    .limit(1);

  if (!existing || existing.invitationId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(wishes)
    .set({
      status,
      moderatedBy: session.user.id,
      moderatedAt: new Date(),
    })
    .where(eq(wishes.id, wishId))
    .returning();

  return NextResponse.json({ wish: updated });
}
