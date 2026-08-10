/**
 * POST /api/v1/invitations/[id]/ai/compose
 *
 * Generate an AI-composed layout recipe for an invitation.
 *
 * Body:
 *   {
 *     tenantSlug: string
 *     groomName: string
 *     brideName: string
 *     style?: string
 *     mood?: string
 *     hasTimeline?: boolean
 *     hasGallery?: boolean
 *     aiProvider?: "claude" | "gemini"
 *   }
 *
 * Returns: { generationId, recipe }
 */
import { resolveAiProviderChain } from "@/lib/ai-credentials";
import { getServerSession } from "@/lib/session";
import { getFeatureFlags } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import { generateComposerRecipe } from "@invyte/ai";
import { aiGenerations, db, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const composeSchema = z.object({
  tenantSlug: z.string().min(1),
  groomName: z.string().min(1),
  brideName: z.string().min(1),
  style: z.string().optional(),
  mood: z.string().optional(),
  hasTimeline: z.boolean().optional().default(false),
  hasGallery: z.boolean().optional().default(false),
  // "auto" tries every provider with a configured key, round-robin start
  // point + fallback to the next on failure (see resolveAiProviderChain).
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
  const parsed = composeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tenantSlug, groomName, brideName, style, mood, hasTimeline, hasGallery, aiProvider } =
    parsed.data;

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

  // Run generation synchronously
  try {
    await db
      .update(aiGenerations)
      .set({ status: "running", updatedAt: new Date() })
      .where(eq(aiGenerations.id, generationId));

    // Try each provider in the chain in order — a single entry for an
    // explicit choice, or every configured provider (round-robin start) for
    // "auto", falling back to the next on failure.
    let result: Awaited<ReturnType<typeof generateComposerRecipe>> | undefined;
    let lastError: unknown;
    for (const { provider } of providerChain) {
      try {
        result = await generateComposerRecipe(provider, {
          groomName,
          brideName,
          ...(style !== undefined ? { style } : {}),
          ...(mood !== undefined ? { mood } : {}),
          hasTimeline,
          hasGallery,
          primaryLanguage: "id",
        });
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (!result) throw lastError ?? new Error("AI composer generation failed");

    const ts = new Date();
    await db
      .update(aiGenerations)
      .set({
        status: "done",
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd.toFixed(6),
        variants: result.recipe,
        updatedAt: ts,
      })
      .where(eq(aiGenerations.id, generationId));

    return NextResponse.json({ generationId, recipe: result.recipe });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await db
      .update(aiGenerations)
      .set({ status: "failed", errorMessage, updatedAt: new Date() })
      .where(eq(aiGenerations.id, generationId));

    return NextResponse.json(
      { error: "AI composer generation failed", detail: errorMessage },
      { status: 500 },
    );
  }
}
