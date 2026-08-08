import { AdminNav } from "@/components/admin/nav";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

const ADMIN_ROLES = new Set(["superadmin", "admin"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminNav role={role} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
