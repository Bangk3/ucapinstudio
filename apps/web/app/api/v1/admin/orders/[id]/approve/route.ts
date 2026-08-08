import { requireAdminSession } from "@/lib/require-admin";
import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

class AlreadyProcessedError extends Error {}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  try {
    const updated = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");

      if (!order || order.paymentStatus !== "pending") {
        throw new AlreadyProcessedError();
      }

      const [row] = await tx
        .update(orders)
        .set({ paymentStatus: "paid", reviewedBy: auth.session.user.id, reviewedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      return row;
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    if (err instanceof AlreadyProcessedError) {
      return NextResponse.json(
        { error: "Order tidak ditemukan atau sudah diproses" },
        { status: 409 },
      );
    }
    throw err;
  }
}
