import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { db, wishes } from "@invyte/db";
import { and, desc, eq } from "drizzle-orm";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  spam: "Spam",
};

export default async function WishesPage({ params, searchParams }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const { status } = await searchParams;

  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  const conditions = [eq(wishes.invitationId, id)];
  if (status && ["pending", "approved", "rejected", "spam"].includes(status)) {
    conditions.push(eq(wishes.status, status as "pending" | "approved" | "rejected" | "spam"));
  }

  const wishList = await db
    .select()
    .from(wishes)
    .where(and(...conditions))
    .orderBy(desc(wishes.createdAt))
    .limit(100);

  const activeStatus = status ?? "";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {invitation.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Buku Tamu</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderasi ucapan dari tamu undangan.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        {(["", "pending", "approved", "rejected", "spam"] as const).map((s) => (
          <Link
            key={s}
            href={
              s
                ? `/${tenant}/dashboard/invitations/${id}/wishes?status=${s}`
                : `/${tenant}/dashboard/invitations/${id}/wishes`
            }
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeStatus === s
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Semua"}
          </Link>
        ))}
      </div>

      {wishList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 gap-3">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada ucapan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wishList.map((wish) => (
            <div key={wish.id} className="rounded-lg border bg-card px-4 py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{wish.senderName}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      wish.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : wish.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {STATUS_LABELS[wish.status] ?? wish.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(wish.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{wish.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
