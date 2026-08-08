import { creditTransactions, tenants, withAdminDb } from "@invyte/db";
import { desc, eq } from "drizzle-orm";

async function fetchTransactions() {
  return withAdminDb((tx) =>
    tx
      .select({
        transaction: creditTransactions,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(creditTransactions)
      .innerJoin(tenants, eq(creditTransactions.tenantId, tenants.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(100),
  );
}

const TYPE_LABELS: Record<string, string> = {
  topup: "Top-Up",
  debit_ai_generation: "AI Generation",
  debit_template_unlock: "Unlock Template",
};

export default async function AdminTransactionsPage() {
  const rows = await fetchTransactions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Tipe</th>
              <th className="px-4 py-2 font-medium text-right">Jumlah</th>
              <th className="px-4 py-2 font-medium text-right">Saldo Setelah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ transaction, tenantName, tenantSlug }) => (
              <tr key={transaction.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2">
                  {tenantName} <span className="text-muted-foreground">({tenantSlug})</span>
                </td>
                <td className="px-4 py-2">{TYPE_LABELS[transaction.type] ?? transaction.type}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${transaction.amount < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {transaction.balanceAfter.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
