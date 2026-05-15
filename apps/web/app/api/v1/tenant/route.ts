import { getServerSession } from "@/lib/session";
import { db, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  tenantSlug: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .optional()
    .nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, ...fields } = parsed.data;

  // Verify user is owner/admin of this tenant
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, session.user.id),
        isNull(tenants.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updates: Partial<typeof tenants.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.primaryColor !== undefined) updates.primaryColor = fields.primaryColor;

  const [updated] = await db.update(tenants).set(updates).where(eq(tenants.id, row.id)).returning();

  return NextResponse.json({ tenant: updated });
}
