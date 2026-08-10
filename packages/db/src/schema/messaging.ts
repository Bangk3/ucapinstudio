import { boolean, index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { guests } from "./guests";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const messageStatusEnum = pgEnum("message_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const messageChannelEnum = pgEnum("message_channel", ["whatsapp", "sms", "email"]);

export const messagingProviderTypeEnum = pgEnum("messaging_provider_type", [
  "whatsapp_cloud",
  "fonnte",
  "wablas",
  // Generic HTTP gateway (Fonnte-style: Authorization header + {target,
  // message} body) with a configurable base URL — for self-hosted WA
  // gateways (e.g. a Baileys-backed service) that aren't a named provider.
  "custom_webhook",
  "smtp",
]);

export const messagingCredentials = pgTable(
  "messaging_credentials",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    provider: messagingProviderTypeEnum("provider").notNull(),
    // AES-256-GCM encrypted JSON blob of provider config
    encryptedConfig: text("encrypted_config").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messaging_creds_tenant_idx").on(t.tenantId)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id").references(() => invitations.id, {
      onDelete: "set null",
    }),
    guestId: text("guest_id").references(() => guests.id, {
      onDelete: "set null",
    }),
    channel: messageChannelEnum("channel").notNull(),
    provider: messagingProviderTypeEnum("provider").notNull(),
    to: varchar("to", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: messageStatusEnum("status").notNull().default("pending"),
    providerId: varchar("provider_id", { length: 255 }),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("messages_tenant_idx").on(t.tenantId),
    index("messages_invitation_idx").on(t.invitationId),
    index("messages_guest_idx").on(t.guestId),
    index("messages_provider_id_idx").on(t.providerId),
  ],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessagingCredential = typeof messagingCredentials.$inferSelect;
export type NewMessagingCredential = typeof messagingCredentials.$inferInsert;
