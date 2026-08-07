import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const tenantTypeEnum = pgEnum("tenant_type", ["personal", "organization", "system"]);
export const tenantPlanEnum = pgEnum("tenant_plan", ["free", "starter", "pro", "enterprise"]);

export const tenants = pgTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    slug: varchar("slug", { length: 48 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    type: tenantTypeEnum("type").notNull().default("personal"),
    plan: tenantPlanEnum("plan").notNull().default("free"),
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }),
    customDomain: varchar("custom_domain", { length: 255 }),
    settings: jsonb("settings").notNull().default({}),
    limits: jsonb("limits").notNull().default({}),
    creditBalance: integer("credit_balance").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("tenants_slug_idx").on(t.slug),
    index("tenants_custom_domain_idx").on(t.customDomain),
  ],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
