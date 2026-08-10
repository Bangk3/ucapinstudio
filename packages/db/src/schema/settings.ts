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
  // Text-valued — public contact/social links, shown in the footer.
  "support_email",
  "social_instagram",
  "social_twitter",
  // Numeric 0/1 — kill switches so superadmin can pause a feature (e.g. AI
  // quota exhausted) without a redeploy. Read as boolean via value === 1.
  "feature_ai_enabled",
  "feature_messaging_enabled",
  // Numeric — wishes with spamScore >= this are auto-flagged "spam" instead
  // of "pending" (0-100 scale, matches wishes.spamScore usage elsewhere).
  "wish_spam_threshold",
  // Text-valued — comma-separated substrings; any match auto-flags a wish.
  "wish_banned_words",
  // Text-valued — manual bank-transfer / QRIS instructions shown on the
  // credit top-up and "dibuatkan admin" order-payment forms. Previously
  // hardcoded "[ISI ... DI SINI]" placeholder strings shown verbatim to
  // real users — found during end-to-end testing.
  "payment_bank_info",
  "payment_qris_info",
]);

export const platformSettings = pgTable("platform_settings", {
  key: platformSettingKeyEnum("key").primaryKey(),
  // Nullable because text-valued keys (admin_whatsapp_number, support_email,
  // etc.) store their value in valueText instead — this table started
  // numeric-only (pricing), so a second typed column was cheaper than a
  // generic value-as-jsonb redesign for a handful of strings.
  value: integer("value"),
  valueText: text("value_text"),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;

// Platform-wide provider credentials (WhatsApp Cloud/Fonnte/Wablas, Anthropic,
// fal.ai) — superadmin-editable fallback used when a tenant hasn't configured
// its own messaging_credentials row, or when no env var is set for AI
// providers. One row per provider; encryptedConfig uses the same AES-256-GCM
// scheme as messaging_credentials (apps/web/lib/encrypt.ts), keyed by
// ENCRYPTION_KEY. A dedicated table (not another platform_settings row)
// because unlike pricing/text settings this is secret material that must
// never round-trip to the client in plaintext.
export const platformCredentialProviderEnum = pgEnum("platform_credential_provider", [
  "whatsapp_cloud",
  "fonnte",
  "wablas",
  // Generic HTTP gateway (self-hosted WA gateway, e.g. Baileys-backed) —
  // see messaging_provider_type's matching value for the shared adapter.
  "custom_webhook",
  "anthropic",
  "gemini",
  "nvidia-nim",
  "fal",
]);

export const platformCredentials = pgTable("platform_credentials", {
  provider: platformCredentialProviderEnum("provider").primaryKey(),
  encryptedConfig: text("encrypted_config").notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformCredential = typeof platformCredentials.$inferSelect;
export type NewPlatformCredential = typeof platformCredentials.$inferInsert;
