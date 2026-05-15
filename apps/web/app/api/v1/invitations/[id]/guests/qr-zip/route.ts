import { getServerSession } from "@/lib/session";
import { db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { zipSync } from "fflate";
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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const access = await resolveInvitationAccess(id, session.user.id);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rawGuestIds = req.nextUrl.searchParams.get("guestIds");

  let rows: { id: string; slug: string; name: string }[];

  if (rawGuestIds) {
    const ids = rawGuestIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    rows = await db
      .select({ id: guests.id, slug: guests.slug, name: guests.name })
      .from(guests)
      .where(and(eq(guests.invitationId, id), inArray(guests.id, ids)));
  } else {
    rows = await db
      .select({ id: guests.id, slug: guests.slug, name: guests.name })
      .from(guests)
      .where(eq(guests.invitationId, id));
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No guests found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const files: Record<string, Uint8Array> = {};

  await Promise.all(
    rows.map(async (guest) => {
      const url = `${appUrl}/${access.tenantSlug}/u/${access.invitationSlug}/${guest.slug}`;
      const buffer = await QRCode.toBuffer(url, { width: 400, margin: 2 });
      const safeName = guest.name.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      files[`qr-${safeName}-${guest.slug}.png`] = new Uint8Array(buffer);
    }),
  );

  const zipped = zipSync(files);

  return new NextResponse(zipped, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qr-${access.invitationSlug}.zip"`,
    },
  });
}
