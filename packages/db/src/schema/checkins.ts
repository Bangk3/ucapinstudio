import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { guests } from "./guests";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const checkins = pgTable(
  "checkins",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestId: text("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
    // "qr" | "manual"
    method: varchar("method", { length: 20 }).notNull().default("qr"),
    operatorNote: text("operator_note"),
  },
  (t) => [
    index("checkins_invitation_idx").on(t.invitationId),
    index("checkins_guest_idx").on(t.guestId),
  ],
);

export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
