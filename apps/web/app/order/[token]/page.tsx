import { OrderIntakeForm } from "@/components/orders/order-intake-form";
import { getPaymentInstructions } from "@/lib/settings";
import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicOrderPage({ params }: Props) {
  const { token } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) notFound();

  const { bankInfo, qrisInfo } = await getPaymentInstructions();

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50/40 px-6 py-16">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-serif font-semibold text-stone-800">
            Data Undangan — {order.customerName}
          </h1>
          <p className="text-sm text-stone-600">
            Harga paket: Rp {order.price.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <OrderIntakeForm
            token={token}
            alreadySubmitted={order.submittedData !== null && order.paymentStatus !== "rejected"}
            paymentStatus={order.paymentStatus}
            rejectionReason={order.paymentStatus === "rejected" ? order.rejectionReason : null}
            bankInfo={bankInfo}
            qrisInfo={qrisInfo}
          />
        </div>
      </div>
    </main>
  );
}
