import { requireAdminSession } from "@/lib/require-admin";
import { creditTopupInTx, topupRequests, withAdminDb, withTenantRls } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

class AlreadyProcessedError extends Error {}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  const [found] = await withAdminDb((tx) =>
    tx
      .select({ tenantId: topupRequests.tenantId })
      .from(topupRequests)
      .where(eq(topupRequests.id, id))
      .limit(1),
  );
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const updated = await withTenantRls(found.tenantId, async (tx) => {
      const [request] = await tx
        .select()
        .from(topupRequests)
        .where(eq(topupRequests.id, id))
        .for("update");

      if (!request || request.status !== "pending") {
        throw new AlreadyProcessedError();
      }

      await creditTopupInTx(
        tx,
        request.tenantId,
        request.packageAmount,
        request.id,
        "Top-up disetujui admin",
      );

      const [row] = await tx
        .update(topupRequests)
        .set({ status: "approved", reviewedBy: auth.session.user.id, reviewedAt: new Date() })
        .where(eq(topupRequests.id, id))
        .returning();

      return row;
    });

    return NextResponse.json({ topupRequest: updated });
  } catch (err) {
    if (err instanceof AlreadyProcessedError) {
      return NextResponse.json({ error: "Request sudah diproses" }, { status: 409 });
    }
    throw err;
  }
}
