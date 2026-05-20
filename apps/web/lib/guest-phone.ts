/**
 * Server-side helper: normalize + hash a guest phone for dedup.
 *
 * Wraps the shared phone util with env-based salt lookup.
 */
import { hashPhone, normalizePhone } from "@invyte/shared";

export interface PhoneFields {
  /** Raw phone string from user input (may be null/empty/invalid) */
  raw?: string | null | undefined;
}

export interface PhoneResolution {
  /** E.164 normalized phone, or null if invalid/missing */
  normalized: string | null;
  /** SHA-256 hex hash, or null if normalized is null */
  hash: string | null;
}

function getSalt(): string {
  const salt = process.env.GUEST_PHONE_HASH_SALT;
  if (!salt || salt.length < 16) {
    throw new Error(
      "GUEST_PHONE_HASH_SALT env var missing or too short (need ≥16 chars). " +
        "Set a random secret in .env.local — used for guest phone dedup hashing.",
    );
  }
  return salt;
}

/**
 * Normalize + hash a phone for storage. Both fields are written to DB:
 * - `phone` (plaintext, for display/messaging)
 * - `phoneHash` (for dedup constraint + lookup)
 */
export async function resolveGuestPhone(
  rawPhone: string | null | undefined,
  tenantId: string,
): Promise<PhoneResolution> {
  const normalized = normalizePhone(rawPhone);
  if (!normalized) return { normalized: null, hash: null };
  const hash = await hashPhone(normalized, tenantId, getSalt());
  return { normalized, hash };
}
