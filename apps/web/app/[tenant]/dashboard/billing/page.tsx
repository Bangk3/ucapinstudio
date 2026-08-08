import { TopupForm } from "@/components/billing/topup-form";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function BillingPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saldo & Top-Up</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Saldo saat ini:{" "}
          <span className="font-medium">
            Rp {tenantRecord.creditBalance.toLocaleString("id-ID")}
          </span>
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <TopupForm tenantSlug={tenant} tenantId={tenantRecord.id} />
      </div>
    </div>
  );
}
