import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { checkins, db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  guestSlug: z.string().min(1),
  tenantSlug: z.string().min(1),
});

// POST — look up guest by invitationId + slug, then record check-in
// Body: { guestSlug: string, tenantSlug: string }
// Returns: { success, guestName, alreadyCheckedIn }
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { guestSlug, tenantSlug } = parsed.data;

  // Verify membership
  const [tenantRow] = await db
    .select({ tenantId: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, session.user.id),
        eq(invitations.id, id),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);

  if (!tenantRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Look up guest by invitation + slug
  const [guest] = await db
    .select({ id: guests.id, name: guests.name, category: guests.category })
    .from(guests)
    .where(and(eq(guests.invitationId, id), eq(guests.slug, guestSlug)))
    .limit(1);

  if (!guest) {
    return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 });
  }

  // Check for duplicate
  const [existing] = await db
    .select({ id: checkins.id })
    .from(checkins)
    .where(and(eq(checkins.guestId, guest.id), eq(checkins.invitationId, id)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ success: true, guestName: guest.name, alreadyCheckedIn: true });
  }

  await db.insert(checkins).values({
    id: uuidv7(),
    tenantId: tenantRow.tenantId,
    invitationId: id,
    guestId: guest.id,
    method: "qr",
    checkedInAt: new Date(),
  });

  return NextResponse.json({ success: true, guestName: guest.name, alreadyCheckedIn: false });
}
