/**
 * POST /api/v1/invitations/[id]/ai/generate
 *
 * Start an AI design variant generation for an invitation.
 *
 * Body:
 *   {
 *     tenantSlug: string
 *     groomName: string
 *     brideName: string
 *     style?: string    // e.g. "modern", "traditional", "islamic"
 *     mood?: string     // e.g. "romantic", "elegant", "minimalist"
 *   }
 *
 * Returns: { generationId, variants }
 */
import { resolveAiProviderChain } from "@/lib/ai-credentials";
import { getServerSession } from "@/lib/session";
import { getFeatureFlags, getPricingSettings } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import { generateVariants } from "@invyte/ai";
import { aiGenerations, db, debitCredit, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const generateSchema = z.object({
  tenantSlug: z.string().min(1),
  groomName: z.string().min(1),
  brideName: z.string().min(1),
  style: z.string().optional(),
  mood: z.string().optional(),
  // "auto" tries every provider with a configured key, round-robin start
  // point + fallback to the next on failure (see resolveAiProviderChain).
  // A specific choice ("claude" etc) uses only that one, no substitution.
  aiProvider: z.enum(["claude", "gemini", "nvidia-nim", "auto"]).optional().default("auto"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { aiEnabled } = await getFeatureFlags();
  if (!aiEnabled) {
    return NextResponse.json({ error: "AI generation is currently disabled" }, { status: 503 });
  }

  const { id: invitationId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tenantSlug, groomName, brideName, style, mood, aiProvider } = parsed.data;

  // Resolve the provider(s) to try. DB-configured keys (superadmin-set via
  // /admin/ai-config) override env vars. "auto" = every configured
  // provider, round-robin start + fallback to the next on failure.
  const credKind = aiProvider === "claude" ? "anthropic" : aiProvider;
  const providerChain = await resolveAiProviderChain(credKind);
  if (providerChain.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada provider AI yang terkonfigurasi. Atur di /admin/ai-config." },
      { status: 503 },
    );
  }

  // Verify user has access to this invitation via tenant membership
  const [row] = await db
    .select({ tenantId: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, session.user.id),
        eq(invitations.id, invitationId),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tenantId } = row;

  // Per-tenant cost cap: sum cost_usd for last 30 days (done generations only)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [costRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(cost_usd), 0)` })
    .from(aiGenerations)
    .where(
      and(
        eq(aiGenerations.tenantId, tenantId),
        gte(aiGenerations.createdAt, thirtyDaysAgo),
        eq(aiGenerations.status, "done"),
      ),
    );

  const totalCost = Number.parseFloat(costRow?.total ?? "0");
  if (totalCost >= 5.0) {
    return NextResponse.json({ error: "Batas biaya bulanan AI tercapai ($5)" }, { status: 429 });
  }

  // Credit balance check — AI generation costs credits, checked before we
  // even create the pending row.
  const { aiGenerationCost } = await getPricingSettings();
  const [tenantRow] = await db
    .select({ creditBalance: tenants.creditBalance })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenantRow || tenantRow.creditBalance < aiGenerationCost) {
    return NextResponse.json(
      {
        error: `Saldo tidak cukup. Butuh Rp ${aiGenerationCost.toLocaleString("id-ID")}, tersedia Rp ${(tenantRow?.creditBalance ?? 0).toLocaleString("id-ID")}.`,
      },
      { status: 402 },
    );
  }

  // Create ai_generation record in pending state
  const generationId = uuidv7();
  const now = new Date();
  await db.insert(aiGenerations).values({
    id: generationId,
    tenantId,
    invitationId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  // Run generation synchronously (no BullMQ worker yet)
  try {
    await db
      .update(aiGenerations)
      .set({ status: "running", updatedAt: new Date() })
      .where(eq(aiGenerations.id, generationId));

    // Try each provider in the chain in order — a single entry for an
    // explicit choice, or every configured provider (round-robin start) for
    // "auto", falling back to the next on failure.
    let result: Awaited<ReturnType<typeof generateVariants>> | undefined;
    let lastError: unknown;
    for (const { provider } of providerChain) {
      try {
        result = await generateVariants(provider, {
          groomName,
          brideName,
          ...(style !== undefined ? { style } : {}),
          ...(mood !== undefined ? { mood } : {}),
          primaryLanguage: "id",
        });
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (!result) throw lastError ?? new Error("AI generation failed");

    // Debit credit BEFORE marking the row "done": if this throws (e.g. a
    // concurrent request drained the balance between our pre-check and this
    // row-locked debit), the catch below writes an honest "failed" status —
    // the tenant was never charged and the variants are correctly discarded.
    await debitCredit(tenantId, aiGenerationCost, "debit_ai_generation", {
      referenceType: "ai_generation",
      referenceId: generationId,
      description: `AI generation (${result.model})`,
    });

    const ts = new Date();
    await db
      .update(aiGenerations)
      .set({
        status: "done",
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd.toFixed(6),
        variants: result.variants,
        updatedAt: ts,
      })
      .where(eq(aiGenerations.id, generationId));

    return NextResponse.json({ generationId, variants: result.variants });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await db
      .update(aiGenerations)
      .set({ status: "failed", errorMessage, updatedAt: new Date() })
      .where(eq(aiGenerations.id, generationId));

    return NextResponse.json(
      { error: "AI generation failed", detail: errorMessage },
      { status: 500 },
    );
  }
}
