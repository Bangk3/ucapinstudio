import { countGuests, listGuests } from "@/lib/guests";
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
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

const createGuestSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  category: guestCategoryEnum.default("other"),
  plusOneAllowed: z.boolean().default(false),
  notes: z.string().optional(),
  tenantSlug: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

  const [rows, total] = await Promise.all([
    listGuests(id, {
      ...(search !== undefined ? { search } : {}),
      ...(category !== undefined ? { category } : {}),
      limit,
      offset,
    }),
    countGuests(id),
  ]);

  return NextResponse.json({ guests: rows, total });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = createGuestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, ...fields } = parsed.data;

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const guestId = uuidv7();
  const slug = nanoid(8);
  const now = new Date();

  const [guest] = await db
    .insert(guests)
    .values({
      id: guestId,
      tenantId: resolved.tenantId,
      invitationId: id,
      slug,
      name: fields.name,
      category: fields.category,
      plusOneAllowed: fields.plusOneAllowed,
      ...(fields.phone !== undefined ? { phone: fields.phone } : {}),
      ...(fields.email !== undefined ? { email: fields.email } : {}),
      ...(fields.notes !== undefined ? { notes: fields.notes } : {}),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ guest }, { status: 201 });
}
