import { decrypt } from "@/lib/encrypt";
import { AnthropicProvider, GeminiProvider, type IAiProvider, NvidiaNimProvider } from "@invyte/ai";
import { db, platformCredentials } from "@invyte/db";
import { eq } from "drizzle-orm";

export type AiProviderKind = "anthropic" | "gemini" | "nvidia-nim";

const ALL_AI_PROVIDER_KINDS: AiProviderKind[] = ["anthropic", "gemini", "nvidia-nim"];

const ENV_VARS: Record<AiProviderKind, string | undefined> = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  gemini: process.env.GOOGLE_API_KEY,
  "nvidia-nim": process.env.NVIDIA_NIM_API_KEY,
};

/**
 * Resolves a platform AI provider API key: DB value (superadmin-set via
 * /admin/ai-config) overrides the env var when present, so key rotation
 * doesn't require a redeploy. Falls back to the env var otherwise. Reads
 * fresh from the DB every call — no caching, matching lib/settings.ts.
 */
export async function resolveAiApiKey(
  provider: AiProviderKind | "fal",
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

function buildAiProvider(kind: AiProviderKind, apiKey: string): IAiProvider {
  switch (kind) {
    case "anthropic":
      return new AnthropicProvider({ apiKey });
    case "gemini":
      return new GeminiProvider({ apiKey });
    case "nvidia-nim":
      return new NvidiaNimProvider({
        apiKey,
        model: process.env.NVIDIA_NIM_MODEL ?? "z-ai/glm4.7",
      });
  }
}

// ponytail: in-memory counter — resets per process/instance, so rotation
// isn't perfectly fair across multiple server instances or restarts. Fine
// for this feature's volume; move to a Redis counter if that starts to
// matter (e.g. one instance always drawing first because it never restarts).
let roundRobinCursor = 0;

/**
 * Resolves the ordered list of AI providers to try for a generation request.
 *
 * - A specific provider ("anthropic"/"gemini"/"nvidia-nim") returns just
 *   that one, with no key configured meaning an empty chain — no silent
 *   substitution when the user explicitly picked a model.
 * - "auto" returns every provider that currently has a usable key (DB or
 *   env), starting point rotated round-robin across calls so load spreads
 *   across providers over time. Callers should try each entry in order and
 *   move to the next on failure — that gives fallback for free on top of
 *   the rotation.
 */
export async function resolveAiProviderChain(
  requested: AiProviderKind | "auto",
): Promise<{ kind: AiProviderKind; provider: IAiProvider }[]> {
  if (requested !== "auto") {
    const apiKey = await resolveAiApiKey(requested, ENV_VARS[requested]);
    return apiKey ? [{ kind: requested, provider: buildAiProvider(requested, apiKey) }] : [];
  }

  const resolved = await Promise.all(
    ALL_AI_PROVIDER_KINDS.map(async (kind) => {
      const apiKey = await resolveAiApiKey(kind, ENV_VARS[kind]);
      return apiKey ? { kind, provider: buildAiProvider(kind, apiKey) } : null;
    }),
  );
  const available = resolved.filter(
    (r): r is { kind: AiProviderKind; provider: IAiProvider } => r !== null,
  );
  if (available.length === 0) return [];

  const start = roundRobinCursor % available.length;
  roundRobinCursor = (roundRobinCursor + 1) % available.length;
  return [...available.slice(start), ...available.slice(0, start)];
}
