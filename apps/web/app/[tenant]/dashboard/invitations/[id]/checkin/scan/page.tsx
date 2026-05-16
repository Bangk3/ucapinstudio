import { CheckinScanner } from "@/components/invitations/checkin-scanner";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

// Full-screen scanner page — no layout chrome (back button is inside the scanner)
export default async function CheckinScanPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  return (
    <CheckinScanner
      invitationId={id}
      tenantSlug={tenant}
      backHref={`/${tenant}/dashboard/invitations/${id}/checkin`}
    />
  );
}
