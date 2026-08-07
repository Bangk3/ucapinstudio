import { getServerSession } from "@/lib/session";
import { getUserTenants } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (session) {
    const tenants = await getUserTenants(session.user.id);
    const first = tenants[0];
    redirect(first ? `/${first.tenant.slug}/dashboard` : "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight">UcapinStudio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform undangan digital</p>
        </div>
        {children}
      </div>
    </div>
  );
}
