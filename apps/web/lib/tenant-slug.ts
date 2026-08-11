import { db, tenants } from "@invyte/db";
import { eq } from "drizzle-orm";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Slugify `base` and append a random suffix, retrying on collision. */
export async function uniqueTenantSlug(base: string): Promise<string> {
  let slug = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}`;
  let attempt = 0;
  // Extremely unlikely to collide given the random suffix, but check anyway
  // rather than trusting randomness alone for a uniqueness constraint.
  while (true) {
    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (!existing) return slug;
    attempt++;
    slug = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}-${attempt}`;
  }
}
