import { getServerSession } from "@/lib/session";
import { getUserTenants } from "@/lib/tenant";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession();

  if (session) {
    const tenants = await getUserTenants(session.user.id);
    const first = tenants[0];
    if (first) redirect(`/${first.tenant.slug}/dashboard`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="font-serif text-5xl font-bold tracking-tight">Invyte</h1>
        <p className="mt-4 text-lg text-gray-600">
          Open-source digital wedding invitation platform
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/auth/register"
            className="rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Daftar Gratis
          </Link>
        </div>
      </div>
    </main>
  );
}
