import { auth } from "@/lib/auth";
import { requireAdminSession } from "@/lib/require-admin";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const adminAuth = await requireAdminSession(req, { write: true });
  if (!adminAuth.ok) return NextResponse.json({ error: "Forbidden" }, { status: adminAuth.status });

  const { id } = await ctx.params;
  // `auth`'s exported type strips plugin-specific endpoints (see lib/auth.ts comment);
  // unbanUser comes from the admin plugin, so it's not visible on the declared type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (auth.api as any).unbanUser({ body: { userId: id }, headers: req.headers });

  return NextResponse.json({ ok: true });
}
