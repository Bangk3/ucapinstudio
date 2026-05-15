import { createHash } from "node:crypto";
import { rateLimitIp } from "@/lib/rate-limit";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, wishes } from "@invyte/db";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

function calcSpamScore(message: string): number {
  if (message.length < 5) return 1.0;
  if (message.includes("http")) return 0.8;
  if (message.length > 1000) return 0.5;
  return 0;
}

const postWishSchema = z.object({
  invitationId: z.string().min(1),
  senderName: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  guestId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const invitationId = req.nextUrl.searchParams.get("invitationId");
  if (!invitationId) return NextResponse.json({ error: "invitationId required" }, { status: 400 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 100);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

  // Verify invitation is published and not deleted
  const [inv] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.status, "published"),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  if (!inv) return NextResponse.json({ wishes: [], total: 0 });

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: wishes.id,
        senderName: wishes.senderName,
        message: wishes.message,
        createdAt: wishes.createdAt,
      })
      .from(wishes)
      .where(and(eq(wishes.invitationId, invitationId), eq(wishes.status, "approved")))
      .orderBy(desc(wishes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(wishes)
      .where(and(eq(wishes.invitationId, invitationId), eq(wishes.status, "approved"))),
  ]);

  return NextResponse.json({ wishes: rows, total: totalRow[0]?.total ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = postWishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { invitationId, senderName, message, guestId } = parsed.data;

  // Validate invitation
  const [inv] = await db
    .select({
      id: invitations.id,
      tenantId: invitations.tenantId,
      wishesEnabled: invitations.wishesEnabled,
      wishesModerated: invitations.wishesModerated,
    })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)))
    .limit(1);

  if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (!inv.wishesEnabled)
    return NextResponse.json({ error: "Wishes are disabled" }, { status: 403 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const userAgentHash = userAgent
    ? createHash("sha256").update(userAgent).digest("hex")
    : undefined;

  // IP rate limit: max 5 wishes per IP per hour (Redis sliding window)
  const rl = await rateLimitIp(`wish:${invitationId}`, ipHash, 5, 60 * 60 * 1000);
  if (rl && !rl.success) {
    return NextResponse.json(
      { error: "Too many wishes. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const spamScore = calcSpamScore(message);
  const status: "pending" | "approved" =
    inv.wishesModerated || spamScore >= 0.8 ? "pending" : "approved";

  const id = uuidv7();

  const [wish] = await db
    .insert(wishes)
    .values({
      id,
      tenantId: inv.tenantId,
      invitationId,
      senderName,
      message,
      status,
      spamScore,
      ipHash,
      ...(guestId !== undefined ? { guestId } : {}),
      ...(userAgentHash !== undefined ? { userAgentHash } : {}),
    })
    .returning();

  return NextResponse.json({ wish, pending: status === "pending" }, { status: 201 });
}
