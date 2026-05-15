import { createHash } from "node:crypto";
import { rateLimitIp } from "@/lib/rate-limit";
import { uuidv7 } from "@/lib/uuid";
import { events, db, guests, invitations, rsvps, withTenantRls } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

const rsvpSchema = z.object({
  invitationId: z.string().min(1),
  guestId: z.string().optional(),
  eventId: z.string().optional(),
  status: z.enum(["yes", "no", "maybe"]),
  guestName: z.string().min(1).max(255),
  plusOneCount: z.number().int().min(0).max(10).default(0),
  dietaryNotes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { invitationId, guestId, eventId, status, guestName, plusOneCount, dietaryNotes } =
    parsed.data;

  // Public lookup — uses invitations_public_read RLS policy (published only, no tenant ctx)
  const [inv] = await db
    .select({
      id: invitations.id,
      tenantId: invitations.tenantId,
      rsvpEnabled: invitations.rsvpEnabled,
    })
    .from(invitations)
    .where(and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)))
    .limit(1);

  if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (!inv.rsvpEnabled) return NextResponse.json({ error: "RSVP is disabled" }, { status: 403 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Rate limit: 10 RSVPs per IP per hour across all invitations
  const rl = await rateLimitIp("rsvp", ipHash, 10, 60 * 60 * 1000);
  if (rl && !rl.success) {
    return NextResponse.json(
      { error: "Too many RSVP submissions. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const id = uuidv7();

  // All subsequent queries run inside withTenantRls — RLS tenant isolation applies
  const rsvpRow = await withTenantRls(inv.tenantId, async (tx) => {
    // Validate guestId belongs to this invitation
    if (guestId) {
      const [guest] = await tx
        .select({ id: guests.id })
        .from(guests)
        .where(and(eq(guests.id, guestId), eq(guests.invitationId, invitationId)))
        .limit(1);
      if (!guest) return null;
    }

    // Validate eventId belongs to this invitation
    if (eventId) {
      const [event] = await tx
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.invitationId, invitationId)))
        .limit(1);
      if (!event) return null;
    }

    // Upsert: if guestId + eventId both present, use conflict target
    if (guestId && eventId) {
      const [row] = await tx
        .insert(rsvps)
        .values({
          id,
          tenantId: inv.tenantId,
          invitationId,
          guestId,
          eventId,
          status,
          guestName,
          plusOneCount,
          ipHash,
          ...(dietaryNotes !== undefined ? { dietaryNotes } : {}),
          ...(userAgent !== undefined ? { userAgent } : {}),
        })
        .onConflictDoUpdate({
          target: [rsvps.guestId, rsvps.eventId],
          set: {
            status,
            guestName,
            plusOneCount,
            ipHash,
            ...(dietaryNotes !== undefined ? { dietaryNotes } : {}),
            ...(userAgent !== undefined ? { userAgent } : {}),
          },
        })
        .returning();
      return row;
    }

    // No conflict target — plain insert
    const [row] = await tx
      .insert(rsvps)
      .values({
        id,
        tenantId: inv.tenantId,
        invitationId,
        ...(guestId !== undefined ? { guestId } : {}),
        ...(eventId !== undefined ? { eventId } : {}),
        status,
        guestName,
        plusOneCount,
        ipHash,
        ...(dietaryNotes !== undefined ? { dietaryNotes } : {}),
        ...(userAgent !== undefined ? { userAgent } : {}),
      })
      .returning();
    return row;
  });

  if (rsvpRow === null) {
    return NextResponse.json({ error: "Guest or event not found" }, { status: 404 });
  }

  const isNew = rsvpRow?.id === id;
  return NextResponse.json({ rsvp: rsvpRow }, { status: isNew ? 201 : 200 });
}
