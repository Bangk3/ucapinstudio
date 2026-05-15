import { GuestManager } from "@/components/invitations/guest-manager";
import { countGuests, listGuests } from "@/lib/guests";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function GuestsPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  const [guestList, total] = await Promise.all([listGuests(id), countGuests(id)]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {invitation.name}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Tamu</h1>
          </div>
        </div>
      </div>

      <GuestManager
        invitationId={id}
        invitationSlug={invitation.slug}
        tenantSlug={tenant}
        initialGuests={guestList}
        initialTotal={total}
      />
    </div>
  );
}
