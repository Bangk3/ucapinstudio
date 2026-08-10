import { encrypt } from "@/lib/encrypt";
import { requireAdminSession } from "@/lib/require-admin";
import { db, platformCredentials } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PROVIDERS = ["anthropic", "gemini", "nvidia-nim", "fal"] as const;

const bodySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1).max(500),
});

// Secret material — GET is superadmin-only too (unlike settings, which
// admins can also read), and never returns the plaintext key.
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const rows = await db
    .select({ provider: platformCredentials.provider, updatedAt: platformCredentials.updatedAt })
    .from(platformCredentials);
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  return NextResponse.json({
    credentials: PROVIDERS.map((provider) => ({
      provider,
      configured: byProvider.has(provider),
      updatedAt: byProvider.get(provider)?.updatedAt ?? null,
    })),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { provider, apiKey } = parsed.data;
  const encryptedConfig = encrypt(JSON.stringify({ apiKey }));
  const now = new Date();

  await db
    .insert(platformCredentials)
    .values({ provider, encryptedConfig, updatedBy: auth.session.user.id, updatedAt: now })
    .onConflictDoUpdate({
      target: platformCredentials.provider,
      set: { encryptedConfig, updatedBy: auth.session.user.id, updatedAt: now },
    });

  return NextResponse.json({ provider, configured: true, updatedAt: now });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const provider = req.nextUrl.searchParams.get("provider");
  const parsed = z.enum(PROVIDERS).safeParse(provider);
  if (!parsed.success) return NextResponse.json({ error: "Invalid provider" }, { status: 422 });

  await db.delete(platformCredentials).where(eq(platformCredentials.provider, parsed.data));

  return NextResponse.json({ provider: parsed.data, configured: false });
}
