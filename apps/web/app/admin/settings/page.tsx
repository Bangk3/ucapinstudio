import { SettingsForm } from "@/components/admin/settings-form";
import { getServerSession } from "@/lib/session";
import { db, platformSettings } from "@invyte/db";

export default async function AdminSettingsPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  const rows = await db.select().from(platformSettings);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <SettingsForm
        initialSettings={rows.map((r) => ({ key: r.key, value: r.value }))}
        canEdit={role === "superadmin"}
      />
    </div>
  );
}
