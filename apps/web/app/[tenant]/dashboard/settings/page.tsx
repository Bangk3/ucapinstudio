import { MembersSection } from "@/components/dashboard/members-section";
import { TenantSettingsForm } from "@/components/dashboard/tenant-settings-form";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { db, memberships } from "@invyte/db";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  // Fetch current user's membership role
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.tenantId, tenantRecord.id), eq(memberships.userId, session.user.id)))
    .limit(1);

  const currentUserRole = membership?.role ?? "viewer";
  const canSeeMembers = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola profil dan preferensi workspace Anda.
        </p>
      </div>

      <TenantSettingsForm
        tenantSlug={tenant}
        initialName={tenantRecord.name}
        initialPrimaryColor={tenantRecord.primaryColor ?? ""}
        tenantType={tenantRecord.type}
        plan={tenantRecord.plan}
      />

      {canSeeMembers && (
        <Suspense
          fallback={
            <div className="rounded-xl border bg-card p-6">
              <div className="h-4 w-40 rounded bg-muted animate-pulse mb-4" />
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <MembersSection
            tenantSlug={tenant}
            tenantId={tenantRecord.id}
            currentUserId={session.user.id}
            currentUserRole={currentUserRole}
          />
        </Suspense>
      )}
    </div>
  );
}
