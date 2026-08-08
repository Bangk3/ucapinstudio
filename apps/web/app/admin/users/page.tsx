import { UserTable } from "@/components/admin/user-table";
import { getServerSession } from "@/lib/session";

export default async function AdminUsersPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <UserTable canModerate={role === "superadmin"} />
    </div>
  );
}
