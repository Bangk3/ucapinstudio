import { InvitationEditor } from "@/components/invitations/invitation-editor";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getPricingSettings } from "@/lib/settings";
import { getUnlockedTemplateIds } from "@/lib/template-access";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function InvitationEditorPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  const unlockedTemplateIds = await getUnlockedTemplateIds(tenantRecord.id);
  const { templateUnlockCost } = await getPricingSettings();

  return (
    <InvitationEditor
      invitation={invitation}
      tenantSlug={tenant}
      unlockedTemplateIds={unlockedTemplateIds}
      templateUnlockCost={templateUnlockCost}
    />
  );
}
