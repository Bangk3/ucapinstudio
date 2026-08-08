import { requireAdminSession } from "@/lib/require-admin";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, orders, tenants } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Pembayaran order belum disetujui" }, { status: 402 });
  }
  if (order.invitationId) {
    return NextResponse.json(
      { error: "Undangan sudah pernah dibuat untuk order ini" },
      { status: 409 },
    );
  }

  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, order.tenantId))
    .limit(1);
  if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });

  const submitted = order.submittedData as {
    hosts: { groomName: string; brideName: string };
    events: Array<{ id: string; name: string }>;
    story?: string;
    galleryUrls?: string[];
  } | null;

  const invitationId = uuidv7();
  const now = new Date();

  const [invitation] = await db
    .insert(invitations)
    .values({
      id: invitationId,
      tenantId: order.tenantId,
      name: `Pernikahan ${order.customerName}`,
      slug: `undangan-${invitationId.slice(0, 8)}`,
      kind: "wedding",
      templateId: "minimalist-modern",
      status: "draft",
      content: submitted
        ? {
            hosts: submitted.hosts,
            events: submitted.events,
            ...(submitted.story ? { story: submitted.story } : {}),
            ...(submitted.galleryUrls ? { galleryUrls: submitted.galleryUrls } : {}),
          }
        : { hosts: { groomName: "", brideName: "" }, events: [] },
      theme: {},
      settings: {},
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.update(orders).set({ invitationId }).where(eq(orders.id, id));

  return NextResponse.json({ invitation, tenantSlug: tenant.slug }, { status: 201 });
}
