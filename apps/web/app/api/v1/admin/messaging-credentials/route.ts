/**
 * GET    /api/v1/admin/messaging-credentials
 *   Read-only status per provider (admin + superadmin). Never returns
 *   decrypted config — just whether a row exists and when it was updated.
 *
 * PUT    /api/v1/admin/messaging-credentials
 *   Upsert the platform-wide default credential for a provider
 *   (superadmin only). Body: { provider, config }.
 *
 * DELETE /api/v1/admin/messaging-credentials?provider=fonnte
 *   Clear the platform-wide default for a provider (superadmin only).
 */
import { encrypt } from "@/lib/encrypt";
import { requireAdminSession } from "@/lib/require-admin";
import { db, platformCredentials } from "@invyte/db";
import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Only these two have adapters wired up (packages/messaging) — wablas has no
// adapter yet, anthropic/fal are AI providers, not messaging.
const PROVIDERS = ["whatsapp_cloud", "fonnte"] as const;
type Provider = (typeof PROVIDERS)[number];

const whatsappCloudConfigSchema = z.object({
  phoneNumberId: z.string().min(1, "Phone Number ID wajib diisi"),
  accessToken: z.string().min(1, "Access Token wajib diisi"),
  businessAccountId: z.string().optional().default(""),
});

const fonnteConfigSchema = z.object({
  apiKey: z.string().min(1, "Token Fonnte wajib diisi"),
  deviceToken: z.string().optional().default(""),
});

const putSchema = z.object({
  provider: z.enum(PROVIDERS),
  config: z.record(z.unknown()),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const rows = await db
    .select({
      provider: platformCredentials.provider,
      updatedAt: platformCredentials.updatedAt,
    })
    .from(platformCredentials)
    .where(inArray(platformCredentials.provider, [...PROVIDERS]));

  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  const result = PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    return { provider, configured: Boolean(row), updatedAt: row?.updatedAt ?? null };
  });

  return NextResponse.json({ credentials: result });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { provider, config } = parsed.data;

  const configCheck: Record<Provider, z.ZodTypeAny> = {
    whatsapp_cloud: whatsappCloudConfigSchema,
    fonnte: fonnteConfigSchema,
  };
  const validConfig = configCheck[provider].safeParse(config);
  if (!validConfig.success) {
    return NextResponse.json({ error: validConfig.error.flatten() }, { status: 422 });
  }

  const now = new Date();
  const encryptedConfig = encrypt(JSON.stringify(validConfig.data));

  await db
    .insert(platformCredentials)
    .values({ provider, encryptedConfig, updatedBy: auth.session.user.id, updatedAt: now })
    .onConflictDoUpdate({
      target: platformCredentials.provider,
      set: { encryptedConfig, updatedBy: auth.session.user.id, updatedAt: now },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const provider = req.nextUrl.searchParams.get("provider");
  if (!provider || !PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  await db
    .delete(platformCredentials)
    .where(eq(platformCredentials.provider, provider as Provider));

  return NextResponse.json({ ok: true });
}
