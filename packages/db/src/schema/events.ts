import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    date: timestamp("date", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    venueName: varchar("venue_name", { length: 255 }),
    venueAddress: text("venue_address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    mapsUrl: text("maps_url"),
    livestreamUrl: text("livestream_url"),
    dressCode: varchar("dress_code", { length: 100 }),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_invitation_idx").on(t.invitationId, t.sortOrder)],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
