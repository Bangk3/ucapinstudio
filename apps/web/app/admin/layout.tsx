import { AdminNav } from "@/components/admin/nav";
import { ADMIN_ROLES } from "@/lib/require-admin";
import { getServerSession } from "@/lib/session";
import { getUserTenants } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) redirect("/");

  // Admin/superadmin also have their own tenant dashboard (see
  // components/dashboard/sidebar.tsx's "Admin Panel" link back the other
  // way) — surface a way back to it if they have one.
  const tenants = await getUserTenants(session.user.id);
  const dashboardSlug = tenants[0]?.tenant.slug;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminNav role={role} dashboardSlug={dashboardSlug} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
