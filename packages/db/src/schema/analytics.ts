import {
  bigserial,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { guests } from "./guests";
import { invitations } from "./invitations";

export const viewEvents = pgTable("view_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  invitationId: text("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  device: varchar("device", { length: 20 }), // "mobile" | "desktop" | "tablet" | "unknown"
  country: varchar("country", { length: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    id: text("id").primaryKey(),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    views: integer("views").notNull().default(0),
    uniqueVisitors: integer("unique_visitors").notNull().default(0),
    rsvpYes: integer("rsvp_yes").notNull().default(0),
    rsvpNo: integer("rsvp_no").notNull().default(0),
    rsvpMaybe: integer("rsvp_maybe").notNull().default(0),
    wishes: integer("wishes").notNull().default(0),
  },
  (t) => [unique().on(t.invitationId, t.date)],
);

export type ViewEvent = typeof viewEvents.$inferSelect;
export type NewViewEvent = typeof viewEvents.$inferInsert;
export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;
export type NewAnalyticsDaily = typeof analyticsDaily.$inferInsert;
