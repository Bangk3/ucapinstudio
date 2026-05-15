import { index, pgEnum, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { guests } from "./guests";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const wishStatusEnum = pgEnum("wish_status", ["pending", "approved", "rejected", "spam"]);

export const wishes = pgTable(
  "wishes",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
    senderName: varchar("sender_name", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: wishStatusEnum("status").notNull().default("pending"),
    spamScore: real("spam_score").notNull().default(0),
    moderatedBy: text("moderated_by").references(() => user.id),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgentHash: varchar("user_agent_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wishes_invitation_status_idx").on(t.invitationId, t.status),
    index("wishes_created_idx").on(t.invitationId, t.createdAt),
  ],
);

export type Wish = typeof wishes.$inferSelect;
export type NewWish = typeof wishes.$inferInsert;
