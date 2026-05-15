import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { assertTenantMember } from "@/lib/tenant";
import { redirect } from "next/navigation";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function DashboardLayout({ children, params }: Props) {
  const session = await getServerSession();
  if (!session) {
    redirect("/auth/login");
  }

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) {
    redirect("/");
  }

  await assertTenantMember(session.user.id, tenantRecord.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar tenantSlug={tenant} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={session.user} tenantSlug={tenant} tenantName={tenantRecord.name} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
