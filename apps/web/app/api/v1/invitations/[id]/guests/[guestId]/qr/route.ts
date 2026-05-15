import { getServerSession } from "@/lib/session";
import { db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

async function resolveInvitationAccess(
  invitationId: string,
  userId: string,
): Promise<{ tenantSlug: string; invitationSlug: string } | null> {
  const [row] = await db
    .select({ tenantSlug: tenants.slug, invitationSlug: invitations.slug })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(invitations.id, invitationId),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

type Ctx = { params: Promise<{ id: string; guestId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, guestId } = await ctx.params;

  const access = await resolveInvitationAccess(id, session.user.id);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [guest] = await db
    .select({ id: guests.id, slug: guests.slug, invitationId: guests.invitationId })
    .from(guests)
    .where(and(eq(guests.id, guestId), eq(guests.invitationId, id)))
    .limit(1);

  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/${access.tenantSlug}/u/${access.invitationSlug}/${guest.slug}`;

  const buffer = await QRCode.toBuffer(url, { width: 400, margin: 2 });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${guest.slug}.png"`,
    },
  });
}
