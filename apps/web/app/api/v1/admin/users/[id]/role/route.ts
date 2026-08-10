/**
 * POST /api/v1/admin/users/[id]/role
 *
 * Change a user's platform-level role (superadmin only). Body: { role }.
 */
import { requireAdminSession } from "@/lib/require-admin";
import { db, user } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ROLES = ["user", "admin", "superadmin"] as const;
const bodySchema = z.object({ role: z.enum(ROLES) });

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const adminAuth = await requireAdminSession(req, { write: true });
  if (!adminAuth.ok) return NextResponse.json({ error: "Forbidden" }, { status: adminAuth.status });

  const { id } = await ctx.params;

  // Prevent a superadmin from demoting/promoting themselves — a self-lockout
  // (e.g. accidentally demoting the only superadmin) would need direct DB
  // access to fix.
  if (id === adminAuth.session.user.id) {
    return NextResponse.json({ error: "Tidak bisa mengubah role akun sendiri" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const [updated] = await db
    .update(user)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning({ id: user.id });

  if (!updated) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true, role: parsed.data.role });
}
