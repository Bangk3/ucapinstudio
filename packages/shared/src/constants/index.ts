export const TENANT_TYPES = ["personal", "organization", "system"] as const;
export const TENANT_PLANS = ["free", "starter", "pro", "enterprise"] as const;
export const MEMBER_ROLES = ["owner", "admin", "editor", "viewer"] as const;

export const INVITATION_STATUSES = ["draft", "published", "archived"] as const;
export const INVITATION_KINDS = [
  "wedding",
  "engagement",
  "birthday",
  "aqiqah",
  "khitanan",
  "baby_shower",
  "corporate",
] as const;

export const RSVP_STATUSES = ["yes", "no", "maybe"] as const;
export const WISH_STATUSES = ["pending", "approved", "rejected", "spam"] as const;

export const SUPPORTED_LOCALES = ["id", "en", "ar", "jv", "su"] as const;
export const DEFAULT_LOCALE = "id" as const;

export const RESERVED_SLUGS = new Set([
  "system",
  "admin",
  "api",
  "auth",
  "health",
  "static",
  "assets",
  "media",
  "www",
  "mail",
  "blog",
  "docs",
  "help",
  "support",
]);

export const MAX_INVITATION_FREE = 3;
export const MAX_GUESTS_FREE = 500;
export const MAX_AI_GENERATIONS_FREE = 5;
export const GUEST_SLUG_LENGTH = 8;
export const CSV_MAX_ROWS = 10_000;
