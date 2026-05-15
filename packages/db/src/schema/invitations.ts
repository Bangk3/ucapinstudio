import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const invitationStatusEnum = pgEnum("invitation_status", ["draft", "published", "archived"]);
export const invitationKindEnum = pgEnum("invitation_kind", [
  "wedding",
  "engagement",
  "birthday",
  "aqiqah",
  "khitanan",
  "baby_shower",
  "corporate",
]);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    status: invitationStatusEnum("status").notNull().default("draft"),
    kind: invitationKindEnum("kind").notNull().default("wedding"),
    templateId: varchar("template_id", { length: 100 }),
    content: jsonb("content").notNull().default({}),
    theme: jsonb("theme").notNull().default({}),
    settings: jsonb("settings").notNull().default({}),
    rsvpEnabled: boolean("rsvp_enabled").notNull().default(true),
    wishesEnabled: boolean("wishes_enabled").notNull().default(true),
    wishesModerated: boolean("wishes_moderated").notNull().default(false),
    passwordHash: text("password_hash"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("invitations_tenant_status_idx").on(t.tenantId, t.status),
    index("invitations_tenant_slug_idx").on(t.tenantId, t.slug),
    index("invitations_created_idx").on(t.tenantId, t.createdAt),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
