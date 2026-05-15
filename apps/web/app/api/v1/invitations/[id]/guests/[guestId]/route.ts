import { getGuest } from "@/lib/guests";
import { getServerSession } from "@/lib/session";
import { db, guests, invitations, memberships, tenants } from "@invyte/db";
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

const guestCategoryEnum = z.enum([
  "family",
  "friends",
  "colleagues",
  "school",
  "community",
  "vip",
  "other",
]);

const patchGuestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  category: guestCategoryEnum.optional(),
  plusOneAllowed: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  tenantSlug: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string; guestId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, guestId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchGuestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, ...fields } = parsed.data;

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await getGuest(guestId);
  if (!existing || existing.invitationId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.name !== undefined) updateFields.name = fields.name;
  if (fields.phone !== undefined) updateFields.phone = fields.phone;
  if (fields.email !== undefined) updateFields.email = fields.email;
  if (fields.category !== undefined) updateFields.category = fields.category;
  if (fields.plusOneAllowed !== undefined) updateFields.plusOneAllowed = fields.plusOneAllowed;
  if (fields.notes !== undefined) updateFields.notes = fields.notes;

  const [updated] = await db
    .update(guests)
    .set(updateFields)
    .where(eq(guests.id, guestId))
    .returning();

  return NextResponse.json({ guest: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, guestId } = await ctx.params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await getGuest(guestId);
  if (!existing || existing.invitationId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(guests).where(eq(guests.id, guestId));

  return NextResponse.json({ ok: true });
}
