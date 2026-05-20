/**
 * Phone normalization + hashing utilities for guest deduplication.
 *
 * Design:
 * - Normalize to E.164-like format ("+62812..."). Indonesia default.
 * - Hash with SHA-256 + app salt + tenant ID (defense against rainbow tables).
 * - Hashed value stored in DB for unique constraint per (invitationId, phoneHash).
 * - Plaintext phone never appears in URLs/slugs (PII risk).
 */

const DEFAULT_COUNTRY_CODE = "62"; // Indonesia

/**
 * Normalize a phone string to E.164-like format "+<countrycode><number>".
 * Returns null if input is empty or invalid.
 *
 * Rules (Indonesia-focused, falls back gracefully):
 * - Strip spaces, dashes, parens, dots
 * - Leading "0" → replace with country code (Indonesia 62)
 * - Leading "+" → keep country code as-is
 * - Otherwise → prepend default country code
 * - Output: "+62812..."
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let cleaned = input.replace(/[\s\-().]/g, "");
  if (!cleaned) return null;

  // Handle international prefix
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("00")) {
    // Some users write 0062... — convert to 62...
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("0")) {
    // Local Indonesia format (e.g. 0812...) → +62812...
    cleaned = `${DEFAULT_COUNTRY_CODE}${cleaned.slice(1)}`;
  } else if (!/^\d{1,3}/.test(cleaned.slice(0, 3))) {
    return null;
  }

  // Validate: digits only, length 8-15 (E.164 max)
  if (!/^\d{8,15}$/.test(cleaned)) return null;

  return `+${cleaned}`;
}

/**
 * Last 4 digits of a normalized phone — used for UI disambiguation
 * (e.g. "Budi (•••• 7890)" when names collide).
 */
export function phoneLastFour(normalized: string | null | undefined): string | null {
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

/**
 * Hash a normalized phone with app-wide salt + tenant ID.
 * Returns 64-char hex SHA-256 digest.
 *
 * Salt is read from env GUEST_PHONE_HASH_SALT — required.
 * If salt missing, function throws (don't fail silently).
 *
 * Uses Web Crypto API (available in Node 20+ and edge runtime).
 */
export async function hashPhone(
  normalizedPhone: string,
  tenantId: string,
  salt: string,
): Promise<string> {
  if (!salt) throw new Error("hashPhone: salt required");
  if (!tenantId) throw new Error("hashPhone: tenantId required");
  if (!normalizedPhone) throw new Error("hashPhone: phone required");

  const input = `${salt}:${tenantId}:${normalizedPhone}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
