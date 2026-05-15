import { listInvitations } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { PlusCircle, ScrollText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitations = await listInvitations(tenantRecord.id);
  const recent = invitations.slice(0, 5);
  const published = invitations.filter((i) => i.status === "published").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dasbor</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang kembali, {session.user.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Undangan</p>
          <p className="text-3xl font-bold mt-1">{invitations.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Terbit</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{published}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Draft</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">
            {invitations.length - published}
          </p>
        </div>
      </div>

      {/* Recent invitations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Undangan Terbaru</h2>
          <Link
            href={`/${tenant}/dashboard/invitations`}
            className="text-sm text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-12 gap-3">
            <ScrollText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada undangan</p>
            <Link
              href={`/${tenant}/dashboard/invitations/new`}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Buat Undangan
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((inv) => (
              <Link
                key={inv.id}
                href={`/${tenant}/dashboard/invitations/${inv.id}`}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{inv.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inv.slug} &middot; {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span
                  className={`shrink-0 ml-3 rounded-full px-2 py-0.5 text-xs font-medium ${
                    inv.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {inv.status === "published" ? "Terbit" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
