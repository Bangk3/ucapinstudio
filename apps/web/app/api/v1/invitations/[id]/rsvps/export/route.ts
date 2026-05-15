import { getServerSession } from "@/lib/session";
import { events, db, invitations, memberships, rsvps, tenants } from "@invyte/db";
import { and, asc, eq, isNull } from "drizzle-orm";
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

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

  const [rsvpRows, eventRows] = await Promise.all([
    db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.invitationId, id), eq(rsvps.tenantId, resolved.tenantId)))
      .orderBy(asc(rsvps.createdAt)),
    db
      .select()
      .from(events)
      .where(and(eq(events.invitationId, id), eq(events.tenantId, resolved.tenantId))),
  ]);

  const eventMap = new Map(eventRows.map((ev) => [ev.id, ev.name]));

  const header = "name,event,status,plus_one,dietary_notes,created_at";
  const lines = rsvpRows.map((r) =>
    [
      escapeCSV(r.guestName),
      escapeCSV(r.eventId ? (eventMap.get(r.eventId) ?? "") : ""),
      escapeCSV(r.status),
      escapeCSV(String(r.plusOneCount)),
      escapeCSV(r.dietaryNotes),
      escapeCSV(r.createdAt.toISOString()),
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsvps-${id}.csv"`,
    },
  });
}
