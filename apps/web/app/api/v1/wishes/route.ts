import { createHash } from "node:crypto";
import { rateLimitIp } from "@/lib/rate-limit";
import { getModerationSettings } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, wishes, withTenantRls } from "@invyte/db";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

// 0-100 scale, matching platform_settings.wish_spam_threshold. Banned-word
// match wins outright (100); otherwise fall back to the pre-existing simple
// heuristics, scaled up from their old 0-1 range.
function calcSpamScore(senderName: string, message: string, bannedWords: string[]): number {
  if (bannedWords.length > 0) {
    const haystack = `${senderName} ${message}`.toLowerCase();
    if (bannedWords.some((w) => haystack.includes(w.toLowerCase()))) return 100;
  }
  if (message.length < 5) return 100;
  if (message.includes("http")) return 80;
  if (message.length > 1000) return 50;
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

  // Public lookup — invitations_public_read RLS policy (published only, no tenant ctx)
  const [inv] = await db
    .select({ id: invitations.id, tenantId: invitations.tenantId })
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

  // Run inside tenant context — wishes_tenant_iso policy applies
  const result = await withTenantRls(inv.tenantId, async (tx) => {
    const [rows, totalRow] = await Promise.all([
      tx
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
      tx
        .select({ total: count() })
        .from(wishes)
        .where(and(eq(wishes.invitationId, invitationId), eq(wishes.status, "approved"))),
    ]);
    return { wishes: rows, total: totalRow[0]?.total ?? 0 };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = postWishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { invitationId, senderName, message, guestId } = parsed.data;

  // Public lookup — invitations_public_read RLS policy (no tenant ctx)
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

  const { spamThreshold, bannedWords } = await getModerationSettings();
  const spamScore = calcSpamScore(senderName, message, bannedWords);
  const status: "pending" | "approved" | "spam" =
    spamScore >= spamThreshold ? "spam" : inv.wishesModerated ? "pending" : "approved";

  const id = uuidv7();

  // Run inside tenant context — wishes_tenant_iso policy applies
  const wish = await withTenantRls(inv.tenantId, async (tx) => {
    const [row] = await tx
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
    return row;
  });

  // Only hand the row back for immediate optimistic display when it's
  // actually publicly visible. Spam and pending-moderation wishes must not
  // echo the submitted content back — the client falls back to a generic
  // "submitted" message either way, so a spammer gets no signal they were
  // specifically flagged (vs. just queued for review).
  return NextResponse.json(
    { wish: status === "approved" ? wish : undefined, pending: status !== "approved" },
    { status: 201 },
  );
}
