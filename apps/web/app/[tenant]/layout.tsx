import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({ children, params }: Props) {
  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);

  if (!tenantRecord) {
    notFound();
  }

  return <>{children}</>;
}
