import { ADMIN_ROLES } from "@/lib/require-admin";
import { getServerSession } from "@/lib/session";
import { getAdminWhatsappLink, getContactSettings } from "@/lib/settings";
import { getUserTenants } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { HomepageClient } from "./_home";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    const role = (session.user as { role?: string }).role;
    if (role && ADMIN_ROLES.has(role)) redirect("/admin/dashboard");

    const tenants = await getUserTenants(session.user.id);
    const first = tenants[0];
    if (first) redirect(`/${first.tenant.slug}/dashboard`);
  }

  const [adminWhatsappLink, contactSettings] = await Promise.all([
    getAdminWhatsappLink(),
    getContactSettings(),
  ]);
  return <HomepageClient adminWhatsappLink={adminWhatsappLink} contactSettings={contactSettings} />;
}
