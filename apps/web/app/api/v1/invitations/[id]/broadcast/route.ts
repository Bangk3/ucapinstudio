/**
 * POST /api/v1/invitations/[id]/broadcast
 *
 * Fire-and-forget broadcast: inserts message records (pending), returns 202
 * immediately, then processes sends asynchronously.
 *
 * Body:
 *   {
 *     tenantSlug: string
 *     message: string
 *     provider: MessagingProviderType
 *     guestIds?: string[]   // omit or empty → send to all guests
 *     sendAll?: boolean
 *   }
 */
import { decrypt } from "@/lib/encrypt";
import { getServerSession } from "@/lib/session";
import { getFeatureFlags } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import {
  db,
  guests,
  invitations,
  memberships,
  messages,
  messagingCredentials,
  platformCredentials,
  tenants,
} from "@invyte/db";
import type { MessagingProviderType } from "@invyte/messaging";
import { createProvider } from "@invyte/messaging";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const messagingProviderTypeValues = ["whatsapp_cloud", "fonnte", "wablas", "smtp"] as const;

// Providers with a superadmin-configurable platform-wide default credential
// (packages/db/src/schema/settings.ts platformCredentials). Only these two
// have adapters wired up — see packages/messaging.
const PLATFORM_FALLBACK_PROVIDERS = new Set(["whatsapp_cloud", "fonnte"]);

const broadcastSchema = z.object({
  tenantSlug: z.string().min(1),
  message: z.string().min(1),
  provider: z.enum(messagingProviderTypeValues),
  guestIds: z.array(z.string()).optional(),
  sendAll: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function resolveTenantAndInvitation(
  invitationId: string,
  userId: string,
  tenantSlug: string,
): Promise<{ tenantId: string; invitationSlug: string } | null> {
  const [row] = await db
    .select({ tenantId: tenants.id, invitationSlug: invitations.slug })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, userId),
        eq(invitations.id, invitationId),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Render message template: replace {nama} and {link} per guest. */
function renderMessage(
  template: string,
  guestName: string,
  guestSlug: string,
  tenantSlug: string,
  invitationSlug: string,
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${appUrl}/${tenantSlug}/u/${invitationSlug}/${guestSlug}`;
  return template.replace(/\{nama\}/g, guestName).replace(/\{link\}/g, link);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messagingEnabled } = await getFeatureFlags();
  if (!messagingEnabled) {
    return NextResponse.json({ error: "Messaging is currently disabled" }, { status: 503 });
  }

  const { id: invitationId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tenantSlug, message, provider, guestIds, sendAll } = parsed.data;

  const resolved = await resolveTenantAndInvitation(invitationId, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tenantId, invitationSlug } = resolved;

  // Load the active credentials for the requested provider — the tenant's
  // own row first, falling back to the platform-wide default (superadmin-set
  // in /admin/messaging) for providers that support one.
  const [cred] = await db
    .select({ encryptedConfig: messagingCredentials.encryptedConfig })
    .from(messagingCredentials)
    .where(
      and(
        eq(messagingCredentials.tenantId, tenantId),
        eq(messagingCredentials.provider, provider),
        eq(messagingCredentials.isActive, true),
      ),
    )
    .limit(1);

  let encryptedConfig = cred?.encryptedConfig;
  if (!encryptedConfig && PLATFORM_FALLBACK_PROVIDERS.has(provider)) {
    const [platformCred] = await db
      .select({ encryptedConfig: platformCredentials.encryptedConfig })
      .from(platformCredentials)
      .where(eq(platformCredentials.provider, provider as "whatsapp_cloud" | "fonnte"))
      .limit(1);
    encryptedConfig = platformCred?.encryptedConfig;
  }

  if (!encryptedConfig) {
    return NextResponse.json(
      { error: `No active ${provider} credentials configured` },
      { status: 400 },
    );
  }

  // Determine which guests to send to
  const isWhatsApp = provider !== "smtp";
  const guestWhereClause =
    !sendAll && guestIds && guestIds.length > 0
      ? and(eq(guests.invitationId, invitationId), inArray(guests.id, guestIds))
      : eq(guests.invitationId, invitationId);

  const guestRows = await db
    .select({
      id: guests.id,
      phone: guests.phone,
      email: guests.email,
      name: guests.name,
      slug: guests.slug,
    })
    .from(guests)
    .where(guestWhereClause);

  const targetGuests = guestRows.filter((g) => (isWhatsApp ? g.phone !== null : g.email !== null));

  if (targetGuests.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  // Determine channel from provider
  const channel = provider === "smtp" ? ("email" as const) : ("whatsapp" as const);

  // Insert all message records as pending up-front.
  // Render template variables {nama} and {link} per guest here so guests
  // receive personalized messages, not raw placeholder text.
  const now = new Date();
  const messageRecords = targetGuests.map((g) => ({
    id: uuidv7(),
    tenantId,
    invitationId,
    guestId: g.id,
    channel,
    provider: provider as MessagingProviderType,
    to: (isWhatsApp ? g.phone : g.email) as string,
    body: renderMessage(message, g.name, g.slug, tenantSlug, invitationSlug),
    status: "pending" as const,
    createdAt: now,
    updatedAt: now,
  }));

  await db.insert(messages).values(messageRecords);

  // Return 202 immediately; process sends in the background
  const responsePromise = NextResponse.json({ queued: targetGuests.length }, { status: 202 });

  // Fire-and-forget: do NOT await this
  void (async () => {
    let providerInstance: ReturnType<typeof createProvider>;
    try {
      const config = JSON.parse(decrypt(encryptedConfig)) as unknown;
      providerInstance = createProvider(provider, config);
    } catch {
      // Cannot decrypt / bad config — mark all as failed
      await db
        .update(messages)
        .set({ status: "failed", error: "Invalid provider config", updatedAt: new Date() })
        .where(
          inArray(
            messages.id,
            messageRecords.map((r) => r.id),
          ),
        );
      return;
    }

    for (const record of messageRecords) {
      const result = await providerInstance.send({
        to: record.to,
        body: record.body,
        channel: record.channel,
      });

      const ts = new Date();
      if (result.success) {
        await db
          .update(messages)
          .set({
            status: "sent",
            sentAt: ts,
            ...(result.providerId !== undefined ? { providerId: result.providerId } : {}),
            updatedAt: ts,
          })
          .where(eq(messages.id, record.id));

        // Update guest sentAt
        if (record.guestId) {
          await db
            .update(guests)
            .set({ sentAt: ts, sendStatus: "sent", updatedAt: ts })
            .where(eq(guests.id, record.guestId));
        }
      } else {
        await db
          .update(messages)
          .set({
            status: "failed",
            error: result.error ?? "Unknown error",
            updatedAt: ts,
          })
          .where(eq(messages.id, record.id));
      }
    }
  })();

  return responsePromise;
}
