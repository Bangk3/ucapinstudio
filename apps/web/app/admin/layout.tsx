import { DashboardShell } from "@/components/dashboard/shell";
import { ADMIN_ROLES } from "@/lib/require-admin";
import { getServerSession } from "@/lib/session";
import { getUserTenants } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) redirect("/");

  // Same DashboardShell/sidebar as the tenant dashboard — admin/superadmin
  // get one merged nav (see components/dashboard/sidebar.tsx's
  // ADMIN_NAV_ITEMS) instead of a separate admin-only shell. Every
  // registered account gets a personal tenant on signup, so tenants[0]
  // should always exist for an admin/superadmin here in practice.
  const tenants = await getUserTenants(session.user.id);
  const tenantRecord = tenants[0]?.tenant;

  return (
    <DashboardShell
      user={session.user}
      tenantSlug={tenantRecord?.slug ?? ""}
      tenantName={tenantRecord?.name ?? "Admin"}
      creditBalance={tenantRecord?.creditBalance ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
