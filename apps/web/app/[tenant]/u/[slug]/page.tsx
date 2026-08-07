import { PublicInvitation } from "@/components/invitations/public-invitation";
import { getInvitationBySlug } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { trackView } from "@/lib/track-view";
import { db, memberships } from "@invyte/db";
import type { InvitationContent } from "@invyte/templates";
import { and, eq } from "drizzle-orm";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; slug: string }>;
  searchParams: Promise<{ tamu?: string }>;
}

/**
 * Shown when invitation has settings.guestOnly = true and visitor hits
 * the public /u/[slug] route instead of /u/[slug]/[guestSlug].
 */
function GuestOnlyGate() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50/40 px-6 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="h-7 w-7 text-amber-700" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-semibold text-stone-800">Undangan Khusus Tamu</h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Undangan ini hanya dapat dibuka melalui link personal yang dikirimkan kepada tamu
            terdaftar.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">
            Mohon gunakan link pribadi yang Anda terima dari mempelai.
          </p>
        </div>
        <div className="pt-4">
          <p className="text-[11px] uppercase tracking-widest text-stone-400">
            Dibuat dengan UcapinStudio
          </p>
        </div>
      </div>
    </main>
  );
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

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  const { tenant, slug } = await params;
  const { tamu } = await searchParams;

  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) notFound();

  const invitation = await getInvitationBySlug(tenantRecord.id, slug);
  if (!invitation) notFound();

  // Drafts are not publicly accessible
  if (invitation.status !== "published") notFound();

  // Guest-only gate: if settings.guestOnly is true, public link is blocked
  // for visitors. Guests must use their personalized /u/[slug]/[guestSlug]
  // link instead. Authenticated tenant members (owners/admins/editors) are
  // exempt so they can still preview the public URL of their own invitation.
  const settings = (invitation.settings as { guestOnly?: boolean } | null) ?? {};
  if (settings.guestOnly === true) {
    const session = await getServerSession();
    let isMember = false;
    if (session) {
      const [m] = await db
        .select({ userId: memberships.userId })
        .from(memberships)
        .where(
          and(eq(memberships.userId, session.user.id), eq(memberships.tenantId, tenantRecord.id)),
        )
        .limit(1);
      isMember = !!m;
    }
    if (!isMember) return <GuestOnlyGate />;
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? undefined;
  const ua = hdrs.get("user-agent") ?? undefined;
  const ref = hdrs.get("referer") ?? undefined;
  void trackView({
    invitationId: invitation.id,
    ...(ip !== undefined ? { ip } : {}),
    ...(ua !== undefined ? { userAgent: ua } : {}),
    ...(ref !== undefined ? { referrer: ref } : {}),
  }).catch(() => {});

  return (
    <PublicInvitation
      invitation={invitation}
      tenantSlug={tenant}
      {...(tamu ? { guestName: tamu } : {})}
    />
  );
}
