import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola profil dan preferensi workspace Anda.
        </p>
      </div>

      <TenantSettingsForm
        tenantSlug={tenant}
        initialName={tenantRecord.name}
        initialPrimaryColor={tenantRecord.primaryColor ?? ""}
        tenantType={tenantRecord.type}
        plan={tenantRecord.plan}
      />
    </div>
  );
}
