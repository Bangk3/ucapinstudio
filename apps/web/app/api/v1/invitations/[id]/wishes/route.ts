import { getServerSession } from "@/lib/session";
import { db, invitations, memberships, tenants, wishes } from "@invyte/db";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

  const conditions = [eq(wishes.invitationId, id)];
  if (status && ["pending", "approved", "rejected", "spam"].includes(status)) {
    conditions.push(eq(wishes.status, status as "pending" | "approved" | "rejected" | "spam"));
  }

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(wishes)
      .where(and(...conditions))
      .orderBy(desc(wishes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(wishes)
      .where(and(...conditions)),
  ]);

  return NextResponse.json({ wishes: rows, total: totalRow[0]?.total ?? 0 });
}
