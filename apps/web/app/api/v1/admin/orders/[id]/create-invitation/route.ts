import { requireAdminSession } from "@/lib/require-admin";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, orders, tenants } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

class CreateInvitationError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  try {
    const { invitation, tenantSlug } = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
      if (!order) throw new CreateInvitationError(404, "Not found");
      if (order.paymentStatus !== "paid") {
        throw new CreateInvitationError(402, "Pembayaran order belum disetujui");
      }
      if (order.invitationId) {
        throw new CreateInvitationError(409, "Undangan sudah pernah dibuat untuk order ini");
      }

      const [tenant] = await tx
        .select({ slug: tenants.slug })
        .from(tenants)
        .where(eq(tenants.id, order.tenantId))
        .limit(1);
      if (!tenant) throw new CreateInvitationError(404, "Tenant tidak ditemukan");

      const submitted = order.submittedData as {
        hosts: { groomName: string; brideName: string };
        events: Array<{ id: string; name: string }>;
        story?: string;
        galleryUrls?: string[];
      } | null;

      const invitationId = uuidv7();
      const now = new Date();

      const [invitation] = await tx
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

      await tx.update(orders).set({ invitationId }).where(eq(orders.id, id));

      return { invitation, tenantSlug: tenant.slug };
    });

    return NextResponse.json({ invitation, tenantSlug }, { status: 201 });
  } catch (err) {
    if (err instanceof CreateInvitationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
