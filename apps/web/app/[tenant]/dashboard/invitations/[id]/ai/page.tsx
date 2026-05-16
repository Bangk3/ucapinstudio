import { AiGenerationWizardPage } from "@/components/invitations/ai-generation-wizard-page";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function AiGeneratePage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  const content = invitation.content as {
    hosts?: { groomName?: string; brideName?: string };
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {invitation.name}
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight">AI Design Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat variasi desain undangan otomatis menggunakan AI.
          </p>
        </div>
      </div>

      <AiGenerationWizardPage
        invitationId={id}
        tenantSlug={tenant}
        groomName={content.hosts?.groomName ?? ""}
        brideName={content.hosts?.brideName ?? ""}
      />
    </div>
  );
}
