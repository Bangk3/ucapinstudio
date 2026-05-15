import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { guests } from "./guests";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const rsvpStatusEnum = pgEnum("rsvp_status", ["yes", "no", "maybe"]);

export const rsvps = pgTable(
  "rsvps",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
    eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").notNull(),
    guestName: varchar("guest_name", { length: 255 }).notNull(),
    plusOneCount: integer("plus_one_count").notNull().default(0),
    dietaryNotes: text("dietary_notes"),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("rsvps_invitation_idx").on(t.invitationId, t.status),
    index("rsvps_guest_event_idx").on(t.guestId, t.eventId),
    unique("rsvps_guest_event_unique").on(t.guestId, t.eventId),
  ],
);

export type Rsvp = typeof rsvps.$inferSelect;
export type NewRsvp = typeof rsvps.$inferInsert;
