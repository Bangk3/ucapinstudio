import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const guestCategoryEnum = pgEnum("guest_category", [
  "family",
  "friends",
  "colleagues",
  "school",
  "community",
  "vip",
  "other",
]);

export const guests = pgTable(
  "guests",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 12 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    /**
     * SHA-256 hex of (salt + tenantId + normalized E.164 phone). Used for
     * dedup detection within an invitation. NULL when guest has no phone.
     * Plaintext phone never appears in URLs — only here, hashed.
     */
    phoneHash: varchar("phone_hash", { length: 64 }),
    email: varchar("email", { length: 255 }),
    category: guestCategoryEnum("category").notNull().default("other"),
    plusOneAllowed: boolean("plus_one_allowed").notNull().default(false),
    notes: text("notes"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    openCount: integer("open_count").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sendStatus: varchar("send_status", { length: 32 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("guests_invitation_idx").on(t.invitationId),
    index("guests_slug_idx").on(t.invitationId, t.slug),
    index("guests_tenant_idx").on(t.tenantId),
    // Partial unique: only rows where phone_hash IS NOT NULL participate.
    // Prevents same person added twice to same invitation.
    uniqueIndex("guests_invitation_phone_hash_unique")
      .on(t.invitationId, t.phoneHash)
      .where(sql`${t.phoneHash} IS NOT NULL`),
  ],
);

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
