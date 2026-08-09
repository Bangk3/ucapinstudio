import { decrypt } from "@/lib/encrypt";
import { db, platformCredentials } from "@invyte/db";
import { eq } from "drizzle-orm";

/**
 * Resolves a platform AI provider API key: DB value (superadmin-set via
 * /admin/ai-config) overrides the env var when present, so key rotation
 * doesn't require a redeploy. Falls back to the env var otherwise. Reads
 * fresh from the DB every call — no caching, matching lib/settings.ts.
 */
export async function resolveAiApiKey(
  provider: "anthropic" | "fal",
  envVar: string | undefined,
): Promise<string | undefined> {
  const [row] = await db
    .select({ encryptedConfig: platformCredentials.encryptedConfig })
    .from(platformCredentials)
    .where(eq(platformCredentials.provider, provider));

  if (row) {
    try {
      const { apiKey } = JSON.parse(decrypt(row.encryptedConfig)) as { apiKey: string };
      if (apiKey) return apiKey;
    } catch {
      // Corrupt row (e.g. ENCRYPTION_KEY rotated) — fall through to env var.
    }
  }

  return envVar;
}
