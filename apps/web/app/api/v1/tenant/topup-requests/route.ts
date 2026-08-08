import { getServerSession } from "@/lib/session";
import { getPricingSettings } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import { db, memberships, tenants, topupRequests, withTenantRls } from "@invyte/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  tenantSlug: z.string().min(1),
  packageAmount: z.number().int().positive(),
  proofImageUrl: z.string().url(),
});

async function resolveTenantId(tenantSlug: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(eq(tenants.slug, tenantSlug), eq(memberships.userId, userId), isNull(tenants.deletedAt)),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await withTenantRls(tenantId, (tx) =>
    tx
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.tenantId, tenantId))
      .orderBy(desc(topupRequests.createdAt)),
  );

  return NextResponse.json({ topupRequests: rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { topupPackages } = await getPricingSettings();
  if (!topupPackages.includes(parsed.data.packageAmount)) {
    return NextResponse.json(
      { error: "packageAmount harus salah satu paket yang tersedia" },
      { status: 422 },
    );
  }

  const { tenantSlug, packageAmount, proofImageUrl } = parsed.data;
  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = uuidv7();
  const [created] = await withTenantRls(tenantId, (tx) =>
    tx
      .insert(topupRequests)
      .values({
        id,
        tenantId,
        userId: session.user.id,
        packageAmount,
        proofImageUrl,
        status: "pending",
        createdAt: new Date(),
      })
      .returning(),
  );

  return NextResponse.json({ topupRequest: created }, { status: 201 });
}
