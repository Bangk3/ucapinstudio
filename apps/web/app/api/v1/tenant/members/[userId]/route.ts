import { getServerSession } from "@/lib/session";
import { db, memberships, tenants } from "@invyte/db";
import { and, count, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug diperlukan" }, { status: 400 });

  // Resolve tenant
  const [tenantRow] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, tenantSlug), isNull(tenants.deletedAt)))
    .limit(1);

  if (!tenantRow) return NextResponse.json({ error: "Workspace tidak ditemukan" }, { status: 404 });

  // Requester must be owner
  const [requesterMembership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.userId, session.user.id)))
    .limit(1);

  if (!requesterMembership || requesterMembership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cannot remove yourself if you are the only owner
  if (userId === session.user.id) {
    const ownerRows = await db
      .select({ ownerCount: count() })
      .from(memberships)
      .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.role, "owner")));

    if ((ownerRows[0]?.ownerCount ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus satu-satunya pemilik workspace" },
        { status: 409 },
      );
    }
  }

  // Verify target is a member
  const [targetMembership] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.userId, userId)))
    .limit(1);

  if (!targetMembership)
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });

  await db
    .delete(memberships)
    .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.userId, userId)));

  return new NextResponse(null, { status: 204 });
}
