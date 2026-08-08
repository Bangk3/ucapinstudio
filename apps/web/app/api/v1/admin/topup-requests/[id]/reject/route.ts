import { requireAdminSession } from "@/lib/require-admin";
import { topupRequests, withAdminDb } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

class AlreadyProcessedError extends Error {}

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const updated = await withAdminDb(async (tx) => {
      const [request] = await tx
        .select()
        .from(topupRequests)
        .where(eq(topupRequests.id, id))
        .for("update");

      if (!request) throw new AlreadyProcessedError();
      if (request.status !== "pending") throw new AlreadyProcessedError();

      const [row] = await tx
        .update(topupRequests)
        .set({
          status: "rejected",
          reviewedBy: auth.session.user.id,
          reviewedAt: new Date(),
          rejectionReason: parsed.data.reason,
        })
        .where(eq(topupRequests.id, id))
        .returning();

      return row;
    });

    return NextResponse.json({ topupRequest: updated });
  } catch (err) {
    if (err instanceof AlreadyProcessedError) {
      // Covers both "not found" and "already processed" — collapsing them
      // is deliberate here (unlike approve/[id], a 404-vs-409 distinction
      // isn't worth two error branches for a reject action) but if this
      // bothers a future reviewer, split it back out with a dedicated
      // NotFoundError.
      return NextResponse.json(
        { error: "Request tidak ditemukan atau sudah diproses" },
        { status: 409 },
      );
    }
    throw err;
  }
}
