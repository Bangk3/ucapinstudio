import { getServerSession } from "@/lib/session";
import { getUserTenants } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { HomepageClient } from "./_home";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    const tenants = await getUserTenants(session.user.id);
    const first = tenants[0];
    if (first) redirect(`/${first.tenant.slug}/dashboard`);
  }

  return <HomepageClient />;
}
