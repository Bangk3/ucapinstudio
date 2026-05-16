import { AnalyticsDashboard } from "@/components/invitations/analytics-dashboard";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function InvitationAnalyticsPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {invitation.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Analitik</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pantau performa undangan dalam 30 hari terakhir.
        </p>
      </div>

      <AnalyticsDashboard invitationId={id} tenantSlug={tenant} />
    </div>
  );
}
