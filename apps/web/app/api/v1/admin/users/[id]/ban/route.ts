import { auth } from "@/lib/auth";
import { requireAdminSession } from "@/lib/require-admin";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ reason: z.string().min(1).max(500).optional() });

export async function POST(req: NextRequest, ctx: Ctx) {
  const adminAuth = await requireAdminSession(req, { write: true });
  if (!adminAuth.ok) return NextResponse.json({ error: "Forbidden" }, { status: adminAuth.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // `auth`'s exported type strips plugin-specific endpoints (see lib/auth.ts comment);
  // banUser comes from the admin plugin, so it's not visible on the declared type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (auth.api as any).banUser({
    body: { userId: id, banReason: parsed.data.reason ?? "Dibanned oleh admin" },
    headers: req.headers,
  });

  return NextResponse.json({ ok: true });
}
