import { NewInvitationForm } from "@/components/invitations/new-invitation-form";
import { getServerSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function NewInvitationPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Kembali ke Undangan
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Buat Undangan Baru</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pilih template dan isi informasi dasar undangan Anda.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <NewInvitationForm tenantSlug={tenant} />
      </div>
    </div>
  );
}
