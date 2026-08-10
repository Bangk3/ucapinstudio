import { AiCredentialsForm } from "@/components/admin/ai-credentials-form";
import { getServerSession } from "@/lib/session";
import { db, platformCredentials } from "@invyte/db";

const PROVIDERS = ["anthropic", "gemini", "nvidia-nim", "fal"] as const;

export default async function AdminAiConfigPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  const rows = await db
    .select({ provider: platformCredentials.provider, updatedAt: platformCredentials.updatedAt })
    .from(platformCredentials);
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Config</h1>
        <p className="text-sm text-muted-foreground">
          Kelola API key provider AI platform (Anthropic, Gemini, NVIDIA NIM, fal.ai). Key di sini
          menggantikan env var tanpa perlu redeploy. Isi lebih dari satu buat mode "Otomatis"
          (round-robin + fallback) di generator undangan.
        </p>
      </div>
      <AiCredentialsForm
        initialCredentials={PROVIDERS.map((provider) => ({
          provider,
          configured: byProvider.has(provider),
          updatedAt: byProvider.get(provider)?.updatedAt?.toISOString() ?? null,
        }))}
        canEdit={role === "superadmin"}
      />
    </div>
  );
}
