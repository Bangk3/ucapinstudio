import { db, platformSettings } from "@invyte/db";
import { eq } from "drizzle-orm";

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
