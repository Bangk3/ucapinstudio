import { requireAdminSession } from "@/lib/require-admin";
import { db, platformSettings } from "@invyte/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const KEYS = [
  "ai_generation_cost",
  "template_unlock_cost",
  "order_package_price",
  "topup_package_1",
  "topup_package_2",
  "topup_package_3",
] as const;

const bodySchema = z.object(
  Object.fromEntries(KEYS.map((k) => [k, z.number().int().positive().optional()])) as Record<
    (typeof KEYS)[number],
    z.ZodOptional<z.ZodNumber>
  >,
);

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const rows = await db.select().from(platformSettings);
  return NextResponse.json({ settings: rows });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const now = new Date();
  for (const key of KEYS) {
    const value = parsed.data[key];
    if (value === undefined) continue;
    await db
      .insert(platformSettings)
      .values({ key, value, updatedBy: auth.session.user.id, updatedAt: now })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value, updatedBy: auth.session.user.id, updatedAt: now },
      });
  }

  const rows = await db.select().from(platformSettings);
  return NextResponse.json({ settings: rows });
}
