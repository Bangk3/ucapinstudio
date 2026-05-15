import { sql } from "drizzle-orm";
import { type Database, db } from "./client";

/**
 * Execute `fn` inside a transaction with `app.tenant_id` set locally.
 * RLS policies use `current_setting('app.tenant_id', true)` as defense-in-depth.
 *
 * Use this in authenticated API routes that mutate or read sensitive data.
 *
 * @example
 * const result = await withTenantRls(tenantId, async (tx) => {
 *   return tx.select().from(invitations).where(eq(invitations.tenantId, tenantId));
 * });
 */
export async function withTenantRls<T>(
  tenantId: string,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // SET LOCAL scopes to this transaction only — safe with connection pooling
    await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx as unknown as Database);
  });
}

/**
 * @deprecated Use withTenantRls for new code.
 * Kept for backward compat during incremental migration.
 */
export function withTenant(_db: Database, _tenantId: string): Database {
  return _db;
}
