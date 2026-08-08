import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import {
  InsufficientCreditError,
  db,
  debitCredit,
  memberships,
  templateUnlocks,
  tenants,
} from "@invyte/db";
import { TEMPLATES } from "@invyte/templates";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ tenantSlug: z.string().min(1) });

type Ctx = { params: Promise<{ templateId: string }> };

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

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const tenantId = await resolveTenantId(parsed.data.tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const meta = TEMPLATES.find((t) => t.id === templateId);
  if (!meta) return NextResponse.json({ error: "Template tidak dikenal" }, { status: 404 });
  if (!meta.isPremium) {
    return NextResponse.json({ error: "Template ini sudah gratis" }, { status: 409 });
  }

  const [existing] = await db
    .select({ id: templateUnlocks.id })
    .from(templateUnlocks)
    .where(and(eq(templateUnlocks.tenantId, tenantId), eq(templateUnlocks.templateId, templateId)))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "Template sudah di-unlock" }, { status: 409 });
  }

  try {
    const { balanceAfter } = await debitCredit(
      tenantId,
      TEMPLATE_UNLOCK_COST_RUPIAH,
      "debit_template_unlock",
      {
        referenceType: "template_unlock",
        referenceId: templateId,
        description: `Unlock ${meta.name}`,
      },
    );

    await db.insert(templateUnlocks).values({
      id: uuidv7(),
      tenantId,
      templateId,
      unlockedAt: new Date(),
    });

    return NextResponse.json({ ok: true, balanceAfter });
  } catch (err) {
    if (err instanceof InsufficientCreditError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }
}
