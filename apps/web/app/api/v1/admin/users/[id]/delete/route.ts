/**
 * POST /api/v1/admin/users/[id]/delete
 *
 * Soft-deletes a user (superadmin only) — matches this app's general
 * soft-delete-with-retention convention (see CLAUDE.md) rather than a hard
 * DELETE, so it's reversible and doesn't cascade-destroy tenants/orders
 * the user owns. Also bans them (reuses the already-enforced ban check so
 * they're actually locked out immediately, not just flagged) and kills
 * every active session so a cached cookie can't keep working.
 */
import { requireAdminSession } from "@/lib/require-admin";
import { db, session, user } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const adminAuth = await requireAdminSession(req, { write: true });
  if (!adminAuth.ok) return NextResponse.json({ error: "Forbidden" }, { status: adminAuth.status });

  const { id } = await ctx.params;

  if (id === adminAuth.session.user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  const now = new Date();
  const [updated] = await db
    .update(user)
    .set({
      deletedAt: now,
      banned: true,
      banReason: "Akun dihapus oleh admin",
      updatedAt: now,
    })
    .where(eq(user.id, id))
    .returning({ id: user.id });

  if (!updated) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  await db.delete(session).where(eq(session.userId, id));

  return NextResponse.json({ ok: true });
}
