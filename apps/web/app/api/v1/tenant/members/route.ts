import { getServerSession } from "@/lib/session";
import { db, memberships, tenants, user } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug diperlukan" }, { status: 400 });

  // Resolve tenant and verify requester is a member
  const [tenantRow] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, tenantSlug), isNull(tenants.deletedAt)))
    .limit(1);

  if (!tenantRow) return NextResponse.json({ error: "Workspace tidak ditemukan" }, { status: 404 });

  const [requesterMembership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.userId, session.user.id)))
    .limit(1);

  if (!requesterMembership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      userId: memberships.userId,
      role: memberships.role,
      joinedAt: memberships.joinedAt,
      name: user.name,
      email: user.email,
    })
    .from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id))
    .where(eq(memberships.tenantId, tenantRow.id));

  return NextResponse.json({ members: rows });
}

const postSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, email, role } = parsed.data;

  // Resolve tenant
  const [tenantRow] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, tenantSlug), isNull(tenants.deletedAt)))
    .limit(1);

  if (!tenantRow) return NextResponse.json({ error: "Workspace tidak ditemukan" }, { status: 404 });

  // Requester must be owner or admin
  const [requesterMembership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.userId, session.user.id)))
    .limit(1);

  if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find user by email
  const [foundUser] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!foundUser) {
    return NextResponse.json(
      { error: "Pengguna dengan email ini belum terdaftar di UcapinStudio" },
      { status: 404 },
    );
  }

  // Check if already a member
  const [existingMembership] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantRow.id), eq(memberships.userId, foundUser.id)))
    .limit(1);

  if (existingMembership) {
    return NextResponse.json(
      { error: "Pengguna sudah menjadi anggota workspace ini" },
      { status: 409 },
    );
  }

  const now = new Date();
  await db.insert(memberships).values({
    userId: foundUser.id,
    tenantId: tenantRow.id,
    role,
    invitedBy: session.user.id,
    invitedAt: now,
    joinedAt: now,
  });

  return NextResponse.json(
    { member: { userId: foundUser.id, name: foundUser.name, email: foundUser.email, role } },
    { status: 201 },
  );
}
