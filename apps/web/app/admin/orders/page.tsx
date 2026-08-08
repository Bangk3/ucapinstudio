import { OrdersPanel } from "@/components/admin/orders-panel";
import { getServerSession } from "@/lib/session";

export default async function AdminOrdersPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <OrdersPanel canApprove={role === "superadmin"} />
    </div>
  );
}
