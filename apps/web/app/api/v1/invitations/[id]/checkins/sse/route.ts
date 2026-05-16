import { getServerSession } from "@/lib/session";
import { db, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

// GET — SSE stream for real-time check-in events
// Query: tenantSlug (required)
// Auth: requires valid session + tenant membership
// Sends events: { type: "checkin", data: { id, guestId, guestName, checkedInAt } }
// Keep-alive: ": ping\n\n" every 15 seconds
//
// NOTE: Full real-time push (POST → SSE subscribers) would require Redis pub/sub.
// This stub establishes the SSE connection with keep-alive pings; clients should
// poll GET /checkins as the primary data source. The stream is ready to be wired
// to a pub/sub mechanism when Redis is set up.
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug diperlukan" }, { status: 400 });

  // Verify the user has access to this invitation via tenant membership
  const [row] = await db
    .select({ invitationId: invitations.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, session.user.id),
        eq(invitations.id, id),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Keep-alive ping every 15s
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(intervalId);
        }
      }, 15_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
