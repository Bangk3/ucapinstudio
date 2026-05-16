import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { checkins, db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

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

// POST — record a check-in
// Body: { guestId, method?, operatorNote?, tenantSlug }
// Prevents duplicate: if guest already checked in, returns 409 with existing record
// Returns: { checkin, guest: { name, category } }
const checkinSchema = z.object({
  guestId: z.string().min(1),
  method: z.enum(["qr", "manual"]).default("qr"),
  operatorNote: z.string().optional(),
  tenantSlug: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { guestId, method, operatorNote, tenantSlug } = parsed.data;

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify guest belongs to this invitation
  const [guest] = await db
    .select({ id: guests.id, name: guests.name, category: guests.category })
    .from(guests)
    .where(and(eq(guests.id, guestId), eq(guests.invitationId, id)))
    .limit(1);

  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

  // Check for duplicate
  const [existing] = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.guestId, guestId), eq(checkins.invitationId, id)))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "already_checked_in", checkin: existing, guest },
      { status: 409 },
    );
  }

  const [checkin] = await db
    .insert(checkins)
    .values({
      id: uuidv7(),
      tenantId: resolved.tenantId,
      invitationId: id,
      guestId,
      method,
      ...(operatorNote !== undefined ? { operatorNote } : {}),
      checkedInAt: new Date(),
    })
    .returning();

  return NextResponse.json({ checkin, guest }, { status: 201 });
}

// GET — list all checkins for invitation
// Query: tenantSlug (required)
// Returns: array of { id, guestId, guestName, guestCategory, checkedInAt, method }
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug diperlukan" }, { status: 400 });

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: checkins.id,
      guestId: checkins.guestId,
      guestName: guests.name,
      guestCategory: guests.category,
      checkedInAt: checkins.checkedInAt,
      method: checkins.method,
    })
    .from(checkins)
    .innerJoin(guests, eq(guests.id, checkins.guestId))
    .where(eq(checkins.invitationId, id))
    .orderBy(desc(checkins.checkedInAt))
    .limit(50);

  return NextResponse.json({ checkins: rows });
}
