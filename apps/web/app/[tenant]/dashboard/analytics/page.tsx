import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { BarChart2 } from "lucide-react";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analitik</h1>
        <p className="text-muted-foreground text-sm mt-1">Pantau performa undangan Anda.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-20 gap-4">
        <div className="rounded-full bg-muted p-4">
          <BarChart2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center max-w-sm">
          <p className="font-semibold">Segera Hadir</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dashboard analitik dengan data kunjungan, RSVP, dan perangkat akan tersedia di Phase 2.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {["Kunjungan harian", "Corong RSVP", "GeoIP", "Perangkat"].map((label) => (
            <span
              key={label}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
