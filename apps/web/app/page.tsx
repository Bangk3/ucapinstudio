import { ADMIN_ROLES } from "@/lib/require-admin";
import { getServerSession } from "@/lib/session";
import { getAdminWhatsappLink, getContactSettings } from "@/lib/settings";
import { getUserTenants } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { HomepageClient } from "./_home";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    // Admin/superadmin land on their own tenant dashboard just like any
    // user — full invitation-management features, not a stripped-down
    // admin-only page. The admin console is reachable from the same
    // sidebar (components/dashboard/sidebar.tsx's ADMIN_NAV_ITEMS), not
    // by hijacking the post-login landing page.
    const tenants = await getUserTenants(session.user.id);
    const first = tenants[0];
    if (first) redirect(`/${first.tenant.slug}/dashboard`);

    const role = (session.user as { role?: string }).role;
    if (role && ADMIN_ROLES.has(role)) redirect("/admin/dashboard");
  }

  const [adminWhatsappLink, contactSettings] = await Promise.all([
    getAdminWhatsappLink(),
    getContactSettings(),
  ]);
  return <HomepageClient adminWhatsappLink={adminWhatsappLink} contactSettings={contactSettings} />;
}
