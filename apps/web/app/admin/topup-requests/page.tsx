import { TopupQueue } from "@/components/admin/topup-queue";
import { getServerSession } from "@/lib/session";

export default async function AdminTopupRequestsPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Top-Up Requests</h1>
      <TopupQueue canApprove={role === "superadmin"} />
    </div>
  );
}
