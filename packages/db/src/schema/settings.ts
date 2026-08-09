import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const platformSettingKeyEnum = pgEnum("platform_setting_key", [
  "ai_generation_cost",
  "template_unlock_cost",
  "order_package_price",
  "topup_package_1",
  "topup_package_2",
  "topup_package_3",
  // Text-valued setting (uses valueText, not value) — WA number for the
  // homepage's "Dibuatin Admin aja" CTA (wa.me deep link).
  "admin_whatsapp_number",
]);

export const platformSettings = pgTable("platform_settings", {
  key: platformSettingKeyEnum("key").primaryKey(),
  // Nullable because admin_whatsapp_number stores its value in valueText
  // instead — this table started numeric-only (pricing), so a second typed
  // column was cheaper than a generic value-as-jsonb redesign for one string.
  value: integer("value"),
  valueText: text("value_text"),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;
