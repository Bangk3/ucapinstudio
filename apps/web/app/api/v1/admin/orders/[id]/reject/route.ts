import { requireAdminSession } from "@/lib/require-admin";
import { db, media, orders } from "@invyte/db";
import { deleteUploadResult } from "@invyte/storage";
import type { UploadResult } from "@invyte/storage";
import { and, eq } from "drizzle-orm";
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
    const { row: updated, orphanedProof } = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");

      if (!order || order.paymentStatus !== "pending") {
        throw new AlreadyProcessedError();
      }

      // Find the media row backing the proof image (no direct FK — orders
      // and media are linked by tenant + the URL the upload returned) so its
      // storage object can be cleaned up, and soft-delete the row itself:
      // once proofImageUrl is nulled below, nothing else references it.
      let orphanedProof: { key: string; variants: UploadResult["variants"] } | null = null;
      if (order.proofImageUrl) {
        const [proofMedia] = await tx
          .select()
          .from(media)
          .where(and(eq(media.tenantId, order.tenantId), eq(media.publicUrl, order.proofImageUrl)))
          .limit(1);

        if (proofMedia) {
          orphanedProof = {
            key: proofMedia.storageKey,
            variants: proofMedia.variants as UploadResult["variants"],
          };
          await tx.update(media).set({ deletedAt: new Date() }).where(eq(media.id, proofMedia.id));
        }
      }

      const [row] = await tx
        .update(orders)
        .set({
          paymentStatus: "rejected",
          reviewedBy: auth.session.user.id,
          reviewedAt: new Date(),
          rejectionReason: parsed.data.reason,
          // Clear the prior submission so the customer can resubmit — a
          // rejected order is otherwise permanently stuck (submit route 409s
          // whenever submittedData is non-null).
          submittedData: null,
          proofImageUrl: null,
        })
        .where(eq(orders.id, id))
        .returning();

      return { row, orphanedProof };
    });

    // External I/O, not transactional with Postgres — run after the DB
    // transaction commits, same ordering as the submit route's own cleanup
    // path. deleteUploadResult swallows per-object failures itself (logs and
    // moves on), so a storage hiccup here never blocks the rejection.
    if (orphanedProof) {
      await deleteUploadResult({
        key: orphanedProof.key,
        variants: orphanedProof.variants,
        url: "",
        sizeBytes: 0,
        mimeType: "",
      });
    }

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
