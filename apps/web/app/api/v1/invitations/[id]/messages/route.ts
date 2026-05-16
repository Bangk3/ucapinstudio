/**
 * GET /api/v1/invitations/[id]/messages
 *
 * List outbound messages for a given invitation, paginated, newest first.
 * Includes guest name via join.
 *
 * Query params:
 *   tenantSlug  (required)
 *   limit       (default 50, max 200)
 *   offset      (default 0)
 */
import { getServerSession } from "@/lib/session";
import { db, guests, invitations, memberships, messages, tenants } from "@invyte/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: invitationId } = await ctx.params;

  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });
  }

  const resolved = await resolveTenantAndInvitation(invitationId, session.user.id, tenantSlug);
  if (!resolved) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

  const rows = await db
    .select({
      id: messages.id,
      guestId: messages.guestId,
      guestName: guests.name,
      channel: messages.channel,
      provider: messages.provider,
      to: messages.to,
      body: messages.body,
      status: messages.status,
      providerId: messages.providerId,
      error: messages.error,
      sentAt: messages.sentAt,
      deliveredAt: messages.deliveredAt,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(guests, eq(guests.id, messages.guestId))
    .where(eq(messages.invitationId, invitationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ messages: rows });
}
