import { listInvitations } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { PlusCircle, ScrollText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function InvitationsPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitations = await listInvitations(tenantRecord.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Undangan</h1>
          <p className="text-muted-foreground text-sm mt-1">{invitations.length} undangan</p>
        </div>
        <Link
          href={`/${tenant}/dashboard/invitations/new`}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Buat Undangan
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 gap-3">
          <ScrollText className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada undangan</p>
          <p className="text-sm text-muted-foreground">Buat undangan pertama Anda untuk memulai.</p>
          <Link
            href={`/${tenant}/dashboard/invitations/new`}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Buat Undangan
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <Link
              key={inv.id}
              href={`/${tenant}/dashboard/invitations/${inv.id}`}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{inv.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  /{inv.slug} &middot; {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    inv.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {inv.status === "published" ? "Terbit" : "Draft"}
                </span>
                <span className="text-muted-foreground text-xs group-hover:text-foreground transition-colors">
                  Edit &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
