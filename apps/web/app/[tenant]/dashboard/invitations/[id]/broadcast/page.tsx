import { BroadcastWizard } from "@/components/invitations/broadcast-wizard";
import { listGuests } from "@/lib/guests";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function BroadcastPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  // Load all guests (no pagination — broadcast needs full list for selection)
  const guestList = await listGuests(id, { limit: 5000 });

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
          <h1 className="text-2xl font-bold tracking-tight">Kirim Undangan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kirim undangan digital ke tamu via WhatsApp atau Email.
          </p>
        </div>
      </div>

      <BroadcastWizard
        invitationId={id}
        invitationSlug={invitation.slug}
        tenantSlug={tenant}
        guests={guestList.map((g) => ({
          id: g.id,
          name: g.name,
          phone: g.phone,
          email: g.email,
          slug: g.slug,
          category: g.category,
        }))}
      />
    </div>
  );
}
