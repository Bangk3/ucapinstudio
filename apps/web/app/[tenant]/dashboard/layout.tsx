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

  // Not a member of this tenant (e.g. guessed/stale URL, or a URL that
  // belonged to a different account) — bounce to "/" instead of crashing;
  // it re-resolves to wherever this session actually belongs.
  try {
    await assertTenantMember(session.user.id, tenantRecord.id);
  } catch {
    redirect("/");
  }

  return (
    <DashboardShell
      user={session.user}
      tenantSlug={tenant}
      tenantName={tenantRecord.name}
      creditBalance={tenantRecord.creditBalance}
    >
      {children}
    </DashboardShell>
  );
}
