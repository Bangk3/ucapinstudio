import { MessagingCredentialsForm } from "@/components/admin/messaging-credentials-form";
import { getServerSession } from "@/lib/session";
import { db, platformCredentials } from "@invyte/db";
import { inArray } from "drizzle-orm";

const PROVIDERS = ["whatsapp_cloud", "fonnte", "custom_webhook"] as const;

export default async function AdminMessagingPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  const rows = await db
    .select({ provider: platformCredentials.provider, updatedAt: platformCredentials.updatedAt })
    .from(platformCredentials)
    .where(inArray(platformCredentials.provider, [...PROVIDERS]));

  const byProvider = new Map(rows.map((r) => [r.provider, r]));
  const initialStatus = PROVIDERS.map((provider) => {
    const row = byProvider.get(provider);
    return { provider, configured: Boolean(row), updatedAt: row?.updatedAt?.toISOString() ?? null };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messaging</h1>
        <p className="text-sm text-muted-foreground">
          Kredensial WhatsApp platform — dipakai sebagai default saat tenant belum mengatur
          kredensialnya sendiri.
        </p>
      </div>
      <MessagingCredentialsForm initialStatus={initialStatus} canEdit={role === "superadmin"} />
    </div>
  );
}
