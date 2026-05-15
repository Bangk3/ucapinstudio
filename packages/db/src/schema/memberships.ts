import { index, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { tenants } from "./tenants";

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "editor", "viewer"]);

export const memberships = pgTable(
  "memberships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("owner"),
    invitedBy: text("invited_by").references(() => user.id),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.tenantId] }),
    index("memberships_tenant_idx").on(t.tenantId),
    index("memberships_user_idx").on(t.userId),
  ],
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
