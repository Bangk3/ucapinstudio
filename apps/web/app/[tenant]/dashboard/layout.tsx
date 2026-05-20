import { DashboardShell } from "@/components/dashboard/shell";
import { getServerSession } from "@/lib/session";
import { assertTenantMember, getTenantBySlug } from "@/lib/tenant";
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
    <DashboardShell user={session.user} tenantSlug={tenant} tenantName={tenantRecord.name}>
      {children}
    </DashboardShell>
  );
}
