/**
 * POST /api/v1/messages/webhook/[provider]
 *
 * Delivery-status webhook endpoint. Always returns 200 (webhook contract).
 *
 * Supported providers: whatsapp_cloud, fonnte
 *
 * WhatsApp Cloud verification: GET with hub.challenge query param.
 */
import { db, messages } from "@invyte/db";
import { WhatsAppCloudAdapter } from "@invyte/messaging";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ provider: string }> };

const ok = () => NextResponse.json({ ok: true }, { status: 200 });

export async function GET(req: NextRequest, ctx: Ctx) {
  const { provider } = await ctx.params;

  // WhatsApp Cloud API webhook verification handshake
  if (provider === "whatsapp_cloud") {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }

  return ok();
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { provider } = await ctx.params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    // If body is not JSON (e.g. form-encoded), still return 200
    return ok();
  }

  try {
    if (provider === "whatsapp_cloud") {
      await handleWhatsAppCloud(payload);
    } else if (provider === "fonnte") {
      await handleFonnte(payload);
    }
    // Unknown provider — silently accept
  } catch {
    // Never let errors bubble to a non-200; webhooks must always 200
  }

  return ok();
}

async function handleWhatsAppCloud(payload: unknown): Promise<void> {
  // Use a dummy config — we only need parseWebhook which doesn't use config
  const adapter = new WhatsAppCloudAdapter({
    phoneNumberId: "",
    accessToken: "",
  });

  const event = adapter.parseWebhook(payload);
  if (!event) return;

  const deliveryStatuses = ["sent", "delivered", "read", "failed"] as const;
  type DeliveryStatus = (typeof deliveryStatuses)[number];
  const isDeliveryStatus = (s: string): s is DeliveryStatus =>
    (deliveryStatuses as readonly string[]).includes(s);
  if (!isDeliveryStatus(event.status)) return;
  await updateMessageStatus(event.providerId, event.status, event.timestamp);
}

interface FonnteWebhookPayload {
  id?: string | number;
  status?: string;
  date?: string | number;
}

async function handleFonnte(payload: unknown): Promise<void> {
  const body = payload as FonnteWebhookPayload;
  if (!body.id) return;

  const statusMap: Record<string, "sent" | "delivered" | "read" | "failed"> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };

  const rawStatus = typeof body.status === "string" ? body.status : "";
  const status = statusMap[rawStatus] ?? "sent";

  const timestamp =
    body.date !== undefined
      ? new Date(typeof body.date === "number" ? body.date * 1000 : body.date)
      : new Date();

  await updateMessageStatus(String(body.id), status, timestamp);
}

async function updateMessageStatus(
  providerId: string,
  status: "sent" | "delivered" | "read" | "failed",
  timestamp: Date,
): Promise<void> {
  const [existing] = await db
    .select({ id: messages.id, status: messages.status })
    .from(messages)
    .where(eq(messages.providerId, providerId))
    .limit(1);

  if (!existing) return;

  const now = new Date();
  await db
    .update(messages)
    .set({
      status,
      ...(status === "delivered" ? { deliveredAt: timestamp } : {}),
      updatedAt: now,
    })
    .where(eq(messages.id, existing.id));
}
