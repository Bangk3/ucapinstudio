import { PublicInvitation } from "@/components/invitations/public-invitation";
import { getGuestBySlug } from "@/lib/guests";
import { getInvitationBySlug } from "@/lib/invitations";
import { getTenantBySlug } from "@/lib/tenant";
import type { InvitationContent } from "@invyte/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; slug: string; guestSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, slug } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) return {};

  const invitation = await getInvitationBySlug(tenantRecord.id, slug);
  if (!invitation || invitation.status !== "published") return {};

  const content = invitation.content as InvitationContent | null;
  const groomName = content?.hosts?.groomName ?? "";
  const brideName = content?.hosts?.brideName ?? "";
  const title = groomName && brideName ? `Undangan ${groomName} & ${brideName}` : invitation.name;

  return {
    title,
    description: `Anda diundang ke ${title}. Klik untuk melihat undangan digital kami.`,
    openGraph: {
      title,
      description: `Anda diundang ke ${title}.`,
      type: "website",
    },
  };
}

export default async function GuestInvitationPage({ params }: Props) {
  const { tenant, slug, guestSlug } = await params;

  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) notFound();

  const invitation = await getInvitationBySlug(tenantRecord.id, slug);
  if (!invitation) notFound();

  // Drafts are not publicly accessible
  if (invitation.status !== "published") notFound();

  const guest = await getGuestBySlug(invitation.id, guestSlug);
  if (!guest) notFound();

  return (
    <PublicInvitation
      invitation={invitation}
      tenantSlug={tenant}
      guestName={guest.name}
      guestId={guest.id}
    />
  );
}
