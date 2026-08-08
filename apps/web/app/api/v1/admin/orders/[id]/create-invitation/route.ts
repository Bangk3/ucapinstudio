import { CreateInvitationError, createInvitationFromOrder } from "@/lib/orders";
import { requireAdminSession } from "@/lib/require-admin";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  try {
    const { invitation, tenantSlug } = await createInvitationFromOrder(id);
    return NextResponse.json({ invitation, tenantSlug }, { status: 201 });
  } catch (err) {
    if (err instanceof CreateInvitationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
