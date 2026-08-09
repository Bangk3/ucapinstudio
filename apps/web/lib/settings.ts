import { db, platformSettings } from "@invyte/db";
import { eq, inArray } from "drizzle-orm";

export interface PricingSettings {
  aiGenerationCost: number;
  templateUnlockCost: number;
  orderPackagePrice: number;
  topupPackages: [number, number, number];
}

const DEFAULTS: Record<string, number> = {
  ai_generation_cost: 5_000,
  template_unlock_cost: 15_000,
  order_package_price: 150_000,
  topup_package_1: 25_000,
  topup_package_2: 100_000,
  topup_package_3: 500_000,
};

/**
 * Reads all pricing settings fresh from the DB on every call — no caching
 * layer, matching this app's existing precedent (tenant lookups, credit
 * balances) of reading fresh per request rather than pre-optimizing for
 * traffic this project's own stated targets don't require caching for.
 * Falls back to the hardcoded default for any row that's somehow missing
 * (e.g. a fresh DB before the seed step ran) rather than throwing — pricing
 * reads happen on hot paths (AI generation, template unlock) that shouldn't
 * 500 because of a missing settings row.
 */
export async function getPricingSettings(): Promise<PricingSettings> {
  const rows = await db.select().from(platformSettings);
  const byKey = new Map<string, number>(rows.map((r) => [r.key, r.value ?? 0]));
  const get = (key: string) => byKey.get(key) ?? DEFAULTS[key]!;

  return {
    aiGenerationCost: get("ai_generation_cost"),
    templateUnlockCost: get("template_unlock_cost"),
    orderPackagePrice: get("order_package_price"),
    topupPackages: [get("topup_package_1"), get("topup_package_2"), get("topup_package_3")],
  };
}

export interface ContactSettings {
  supportEmail: string | null;
  instagram: string | null;
  twitter: string | null;
}

/** Public contact/social links shown in the homepage footer. */
export async function getContactSettings(): Promise<ContactSettings> {
  const rows = await db
    .select({ key: platformSettings.key, valueText: platformSettings.valueText })
    .from(platformSettings)
    .where(inArray(platformSettings.key, ["support_email", "social_instagram", "social_twitter"]));
  const byKey = new Map(rows.map((r) => [r.key, r.valueText]));
  return {
    supportEmail: byKey.get("support_email") ?? null,
    instagram: byKey.get("social_instagram") ?? null,
    twitter: byKey.get("social_twitter") ?? null,
  };
}

export interface FeatureFlags {
  aiEnabled: boolean;
  messagingEnabled: boolean;
}

/** Superadmin kill switches. Missing row defaults to enabled (fresh DB). */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const rows = await db
    .select({ key: platformSettings.key, value: platformSettings.value })
    .from(platformSettings)
    .where(inArray(platformSettings.key, ["feature_ai_enabled", "feature_messaging_enabled"]));
  const byKey = new Map<string, number | null>(rows.map((r) => [r.key, r.value]));
  const isEnabled = (key: string) => byKey.get(key) !== 0;
  return {
    aiEnabled: isEnabled("feature_ai_enabled"),
    messagingEnabled: isEnabled("feature_messaging_enabled"),
  };
}

/** wa.me deep link for the homepage's "Dibuatin Admin aja" CTA, or null if unset. */
export async function getAdminWhatsappLink(): Promise<string | null> {
  const [row] = await db
    .select({ valueText: platformSettings.valueText })
    .from(platformSettings)
    .where(eq(platformSettings.key, "admin_whatsapp_number"));
  const number = row?.valueText?.replace(/[^0-9]/g, "");
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(
    "Halo, saya mau minta dibuatkan undangan digital di UcapinStudio.",
  )}`;
}

export interface PaymentInstructions {
  bankInfo: string | null;
  qrisInfo: string | null;
}

/** Manual transfer instructions shown on top-up and order-payment forms. */
export async function getPaymentInstructions(): Promise<PaymentInstructions> {
  const rows = await db
    .select({ key: platformSettings.key, valueText: platformSettings.valueText })
    .from(platformSettings)
    .where(inArray(platformSettings.key, ["payment_bank_info", "payment_qris_info"]));
  const byKey = new Map(rows.map((r) => [r.key, r.valueText]));
  return {
    bankInfo: byKey.get("payment_bank_info") ?? null,
    qrisInfo: byKey.get("payment_qris_info") ?? null,
  };
}

export interface ModerationSettings {
  spamThreshold: number;
  bannedWords: string[];
}

/** Wish guestbook spam moderation config — threshold (0-100) and banned substrings. */
export async function getModerationSettings(): Promise<ModerationSettings> {
  const rows = await db
    .select({
      key: platformSettings.key,
      value: platformSettings.value,
      valueText: platformSettings.valueText,
    })
    .from(platformSettings)
    .where(inArray(platformSettings.key, ["wish_spam_threshold", "wish_banned_words"]));

  const threshold = rows.find((r) => r.key === "wish_spam_threshold")?.value;
  const bannedWordsText = rows.find((r) => r.key === "wish_banned_words")?.valueText;

  return {
    spamThreshold: threshold ?? 70,
    bannedWords: bannedWordsText
      ? bannedWordsText
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean)
      : [],
  };
}
