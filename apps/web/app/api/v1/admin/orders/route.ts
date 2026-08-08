import { randomBytes } from "node:crypto";
import { encrypt } from "@/lib/encrypt";
import { requireAdminSession } from "@/lib/require-admin";
import { getPricingSettings } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import { db, memberships, messagingCredentials, orders, tenants } from "@invyte/db";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  customerName: z.string().min(1).max(255),
  customerContact: z.string().min(1).max(255),
  notes: z.string().max(2000).optional(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function uniqueTenantSlug(base: string): Promise<string> {
  let slug = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}`;
  let attempt = 0;
  // Extremely unlikely to collide given the random suffix, but check anyway
  // rather than trusting randomness alone for a uniqueness constraint.
  while (true) {
    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (!existing) return slug;
    attempt++;
    slug = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}-${attempt}`;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { customerName, customerContact, notes } = parsed.data;

  const { orderPackagePrice } = await getPricingSettings();
  const tenantSlug = await uniqueTenantSlug(customerName);
  const tenantId = uuidv7();
  const orderId = uuidv7();
  const accessToken = randomBytes(32).toString("base64url");
  const now = new Date();

  await db.insert(tenants).values({
    id: tenantId,
    slug: tenantSlug,
    name: customerName,
    type: "organization",
    plan: "free",
    settings: { source: "staff_order" },
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(memberships).values({
    userId: auth.session.user.id,
    tenantId,
    role: "owner",
    joinedAt: now,
  });

  // Attach UcapinStudio's shared WhatsApp credential, if configured, so
  // broadcast to the couple's guest list works with zero extra setup.
  // Silently skipped if unset — see Step 2's note.
  if (process.env.WA_CLOUD_API_TOKEN && process.env.WA_PHONE_NUMBER_ID) {
    await db.insert(messagingCredentials).values({
      id: uuidv7(),
      tenantId,
      provider: "whatsapp_cloud",
      encryptedConfig: encrypt(
        JSON.stringify({
          phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
          accessToken: process.env.WA_CLOUD_API_TOKEN,
        }),
      ),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [order] = await db
    .insert(orders)
    .values({
      id: orderId,
      customerName,
      customerContact,
      notes: notes ?? null,
      price: orderPackagePrice,
      createdBy: auth.session.user.id,
      tenantId,
      accessToken,
      paymentStatus: "pending",
      createdAt: now,
    })
    .returning();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({ order, publicUrl: `${appUrl}/order/${accessToken}` }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const statusFilter = req.nextUrl.searchParams.get("status");
  const base = db
    .select({ order: orders, tenantSlug: tenants.slug })
    .from(orders)
    .innerJoin(tenants, eq(orders.tenantId, tenants.id))
    .orderBy(desc(orders.createdAt));

  const rows = statusFilter
    ? await base.where(eq(orders.paymentStatus, statusFilter as "pending" | "paid" | "rejected"))
    : await base;

  return NextResponse.json({ orders: rows });
}
