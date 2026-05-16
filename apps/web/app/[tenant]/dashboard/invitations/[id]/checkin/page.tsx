import { CheckinDashboard } from "@/components/invitations/checkin-dashboard";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { db, guests } from "@invyte/db";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function CheckinPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  const [countRow] = await db
    .select({ value: count() })
    .from(guests)
    .where(eq(guests.invitationId, id));

  const totalGuests = countRow?.value ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {invitation.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Check-in Tamu</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pantau kehadiran tamu secara real-time.
        </p>
      </div>

      <CheckinDashboard invitationId={id} tenantSlug={tenant} totalGuests={totalGuests} />
    </div>
  );
}
