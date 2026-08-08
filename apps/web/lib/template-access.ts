import { templateUnlocks, withTenantRls } from "@invyte/db";
import { TEMPLATES } from "@invyte/templates";
import { and, eq } from "drizzle-orm";

export class TemplateLockedError extends Error {
  constructor(public readonly templateId: string) {
    super(`Template "${templateId}" belum di-unlock`);
    this.name = "TemplateLockedError";
  }
}

export class UnknownTemplateError extends Error {
  constructor(public readonly templateId: string) {
    super(`Template "${templateId}" tidak dikenal`);
    this.name = "UnknownTemplateError";
  }
}

/**
 * Throws if `templateId` doesn't exist, or is premium and `tenantId` hasn't
 * unlocked it. Resolves silently for free templates and already-unlocked
 * premium templates. Call this server-side before creating/updating an
 * invitation with a given templateId — the client-side lock badge is UX
 * only, this is the real enforcement.
 */
export async function assertTemplateAccess(tenantId: string, templateId: string): Promise<void> {
  const meta = TEMPLATES.find((t) => t.id === templateId);
  if (!meta) throw new UnknownTemplateError(templateId);
  if (!meta.isPremium) return;

  const unlocked = await withTenantRls(tenantId, async (tx) => {
    const [row] = await tx
      .select({ id: templateUnlocks.id })
      .from(templateUnlocks)
      .where(
        and(eq(templateUnlocks.tenantId, tenantId), eq(templateUnlocks.templateId, templateId)),
      )
      .limit(1);
    return row !== undefined;
  });

  if (!unlocked) throw new TemplateLockedError(templateId);
}

/** Returns the set of premium template IDs a tenant has already unlocked. */
export async function getUnlockedTemplateIds(tenantId: string): Promise<string[]> {
  return withTenantRls(tenantId, async (tx) => {
    const rows = await tx
      .select({ templateId: templateUnlocks.templateId })
      .from(templateUnlocks)
      .where(eq(templateUnlocks.tenantId, tenantId));
    return rows.map((r) => r.templateId);
  });
}
