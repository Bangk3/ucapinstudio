import { getServerSession } from "@/lib/session";
import { analyticsDaily, db, invitations, memberships, tenants, viewEvents } from "@invyte/db";
import { and, count, countDistinct, eq, gte, isNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

// analyticsDaily is imported to satisfy the export requirement; it will be used in future aggregation jobs
void analyticsDaily;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug diperlukan" }, { status: 400 });

  // Verify the user has access to this invitation via tenant membership
  const [row] = await db
    .select({ invitationId: invitations.id })
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

  if (!row) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalViews, deviceBreakdown, recentDaily] = await Promise.all([
    // Total views + unique visitors (last 30 days)
    db
      .select({
        totalViews: count(),
        uniqueVisitors: countDistinct(viewEvents.ipHash),
      })
      .from(viewEvents)
      .where(and(eq(viewEvents.invitationId, id), gte(viewEvents.createdAt, thirtyDaysAgo))),

    // Device breakdown
    db
      .select({
        device: viewEvents.device,
        count: count(),
      })
      .from(viewEvents)
      .where(and(eq(viewEvents.invitationId, id), gte(viewEvents.createdAt, thirtyDaysAgo)))
      .groupBy(viewEvents.device),

    // Daily views grouped by day (last 30 days)
    db
      .select({
        date: sql<string>`DATE(${viewEvents.createdAt})`,
        views: count(),
        uniqueVisitors: countDistinct(viewEvents.ipHash),
      })
      .from(viewEvents)
      .where(and(eq(viewEvents.invitationId, id), gte(viewEvents.createdAt, thirtyDaysAgo)))
      .groupBy(sql`DATE(${viewEvents.createdAt})`)
      .orderBy(sql`DATE(${viewEvents.createdAt})`),
  ]);

  return NextResponse.json({
    summary: {
      totalViews: totalViews[0]?.totalViews ?? 0,
      uniqueVisitors: totalViews[0]?.uniqueVisitors ?? 0,
    },
    deviceBreakdown,
    dailyViews: recentDaily,
  });
}
