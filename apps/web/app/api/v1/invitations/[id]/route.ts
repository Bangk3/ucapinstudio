import { getInvitation, slugExists } from "@/lib/invitations";
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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const inv = await getInvitation(tenantId, id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ invitation: inv });
}

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  templateId: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  theme: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  rsvpEnabled: z.boolean().optional(),
  wishesEnabled: z.boolean().optional(),
  wishesModerated: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  tenantSlug: z.string().min(1),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, slug, expiresAt, ...updates } = parsed.data;

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await getInvitation(tenantId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (slug && slug !== existing.slug && (await slugExists(tenantId, slug, id))) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  // Deep-merge content, theme, and settings with existing values so partial
  // updates (e.g. AI composer only sending composerRecipe, or settings only
  // sending guestOnly) don't wipe other fields.
  const {
    content: contentPatch,
    theme: themePatch,
    settings: settingsPatch,
    ...otherUpdates
  } = updates;
  const mergedContent = contentPatch
    ? { ...((existing.content as Record<string, unknown>) ?? {}), ...contentPatch }
    : undefined;
  const mergedTheme = themePatch
    ? { ...((existing.theme as Record<string, unknown>) ?? {}), ...themePatch }
    : undefined;
  const mergedSettings = settingsPatch
    ? { ...((existing.settings as Record<string, unknown>) ?? {}), ...settingsPatch }
    : undefined;

  const [updated] = await db
    .update(invitations)
    .set({
      ...otherUpdates,
      ...(mergedContent !== undefined ? { content: mergedContent } : {}),
      ...(mergedTheme !== undefined ? { theme: mergedTheme } : {}),
      ...(mergedSettings !== undefined ? { settings: mergedSettings } : {}),
      ...(slug ? { slug } : {}),
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(invitations.id, id))
    .returning();

  return NextResponse.json({ invitation: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await getInvitation(tenantId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(invitations)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(invitations.id, id));

  return NextResponse.json({ ok: true });
}
