import { getInvitation, slugExists } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

async function uniqueSlug(tenantId: string, base: string): Promise<string> {
  let slug = base.slice(0, 80);
  let attempt = 0;
  while (await slugExists(tenantId, slug)) {
    attempt++;
    slug = `${base.slice(0, 77)}-${attempt}`;
  }
  return slug;
}

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

  const source = await getInvitation(tenantId, id);
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newSlug = await uniqueSlug(tenantId, `${source.slug}-copy`);
  const now = new Date();

  const [copy] = await db
    .insert(invitations)
    .values({
      id: uuidv7(),
      tenantId,
      name: `${source.name} (Copy)`,
      slug: newSlug,
      kind: source.kind,
      templateId: source.templateId,
      status: "draft",
      content: source.content as object,
      theme: source.theme as object,
      settings: source.settings as object,
      rsvpEnabled: source.rsvpEnabled,
      wishesEnabled: source.wishesEnabled,
      wishesModerated: source.wishesModerated,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ invitation: copy }, { status: 201 });
}
