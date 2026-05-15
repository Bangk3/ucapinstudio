import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { db, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function resolveTenantId(tenantSlug: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(eq(tenants.slug, tenantSlug), eq(memberships.userId, userId), isNull(tenants.deletedAt)),
    )
    .limit(1);
  return row?.id ?? null;
}

const bodySchema = z.object({ tenantSlug: z.string().min(1) });

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const tenantId = await resolveTenantId(parsed.data.tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await getInvitation(tenantId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const [updated] = await db
    .update(invitations)
    .set({
      status: existing.status === "published" ? "draft" : "published",
      publishedAt: existing.status === "published" ? null : now,
      updatedAt: now,
    })
    .where(eq(invitations.id, id))
    .returning();

  return NextResponse.json({ invitation: updated });
}
