import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only fields the public page needs — never customerContact, notes,
  // tenantId, createdBy, or anything else internal.
  return NextResponse.json({
    customerName: order.customerName,
    price: order.price,
    paymentStatus: order.paymentStatus,
    hasSubmittedData: order.submittedData !== null,
    hasProof: order.proofImageUrl !== null,
  });
}
