/**
 * GET /api/v1/invitations/[id]/ai/generations?tenantSlug=...
 *
 * List the last 10 AI generations for an invitation (newest first).
 */
import { getServerSession } from "@/lib/session";
import { aiGenerations, db, invitations, memberships, tenants } from "@invyte/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: invitationId } = await params;
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug diperlukan" }, { status: 400 });
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

  const generations = await db
    .select({
      id: aiGenerations.id,
      status: aiGenerations.status,
      model: aiGenerations.model,
      inputTokens: aiGenerations.inputTokens,
      outputTokens: aiGenerations.outputTokens,
      costUsd: aiGenerations.costUsd,
      variants: aiGenerations.variants,
      errorMessage: aiGenerations.errorMessage,
      qaScore: aiGenerations.qaScore,
      createdAt: aiGenerations.createdAt,
    })
    .from(aiGenerations)
    .where(eq(aiGenerations.invitationId, invitationId))
    .orderBy(desc(aiGenerations.createdAt))
    .limit(10);

  return NextResponse.json({ generations });
}
