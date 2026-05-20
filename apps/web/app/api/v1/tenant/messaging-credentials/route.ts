/**
 * GET  /api/v1/tenant/messaging-credentials?tenantSlug=xxx
 *   Returns list of configured providers (no raw config exposed).
 *
 * POST /api/v1/tenant/messaging-credentials
 *   Upsert credentials for a provider. Encrypts config before storing.
 *   Body: { tenantSlug, provider, config: {...} }
 *
 * DELETE /api/v1/tenant/messaging-credentials?tenantSlug=xxx&provider=fonnte
 *   Remove credentials for a provider.
 */
import { encrypt } from "@/lib/encrypt";
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { db, memberships, messagingCredentials, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function resolveTenant(
  tenantSlug: string,
  userId: string,
  requireAdmin = false,
): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id, role: memberships.role })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(eq(tenants.slug, tenantSlug), eq(memberships.userId, userId), isNull(tenants.deletedAt)),
    )
    .limit(1);

  if (!row) return null;
  if (requireAdmin && row.role !== "owner" && row.role !== "admin") return null;
  return row.id;
}

// ── GET — list configured providers ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const tenantId = await resolveTenant(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: messagingCredentials.id,
      provider: messagingCredentials.provider,
      isActive: messagingCredentials.isActive,
      createdAt: messagingCredentials.createdAt,
    })
    .from(messagingCredentials)
    .where(eq(messagingCredentials.tenantId, tenantId));

  return NextResponse.json({ credentials: rows });
}

// ── POST — upsert credentials ─────────────────────────────────────────────────

const fonnteConfigSchema = z.object({
  apiKey: z.string().min(1, "Token Fonnte wajib diisi"),
  deviceToken: z.string().optional().default(""),
});

const postSchema = z.object({
  tenantSlug: z.string().min(1),
  provider: z.enum(["fonnte", "whatsapp_cloud", "smtp"]),
  config: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, provider, config } = parsed.data;

  // Validate provider-specific config shape
  if (provider === "fonnte") {
    const r = fonnteConfigSchema.safeParse(config);
    if (!r.success) return NextResponse.json({ error: r.error.flatten() }, { status: 422 });
  }

  const tenantId = await resolveTenant(tenantSlug, session.user.id, true);
  if (!tenantId)
    return NextResponse.json({ error: "Forbidden — owner/admin only" }, { status: 403 });

  const encryptedConfig = encrypt(JSON.stringify(config));
  const now = new Date();

  // Check existing
  const [existing] = await db
    .select({ id: messagingCredentials.id })
    .from(messagingCredentials)
    .where(
      and(eq(messagingCredentials.tenantId, tenantId), eq(messagingCredentials.provider, provider)),
    )
    .limit(1);

  if (existing) {
    await db
      .update(messagingCredentials)
      .set({ encryptedConfig, isActive: true, updatedAt: now })
      .where(eq(messagingCredentials.id, existing.id));
  } else {
    await db.insert(messagingCredentials).values({
      id: uuidv7(),
      tenantId,
      provider,
      encryptedConfig,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE — remove credentials ───────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  const provider = req.nextUrl.searchParams.get("provider");
  if (!tenantSlug || !provider) {
    return NextResponse.json({ error: "tenantSlug and provider required" }, { status: 400 });
  }

  const tenantId = await resolveTenant(tenantSlug, session.user.id, true);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db
    .delete(messagingCredentials)
    .where(
      and(
        eq(messagingCredentials.tenantId, tenantId),
        eq(messagingCredentials.provider, provider as "fonnte"),
      ),
    );

  return NextResponse.json({ ok: true });
}
