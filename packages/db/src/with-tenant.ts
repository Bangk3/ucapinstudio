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
 * Execute `fn` inside a transaction with tenant context cleared.
 * Use for public-facing routes (RSVP submit, wish submit) where
 * RLS INSERT policies explicitly allow writes without tenant context.
 *
 * @example
 * await withPublicDb(async (tx) => {
 *   await tx.insert(rsvps).values({ ... });
 * });
 */
export async function withPublicDb<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    // Clear any inherited tenant context — public writes have their own RLS policies
    await tx.execute(sql`SELECT set_config('app.tenant_id', '', true)`);
    return fn(tx as unknown as Database);
  });
}

/**
 * Execute `fn` with the admin cross-tenant RLS bypass flag set. Only call
 * this after requireAdminSession() has already verified the caller's role
 * server-side — this function itself does no authorization, it only sets
 * the DB session flag the RLS admin policies check.
 */
export async function withAdminDb<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.tenant_id', '', true)`);
    await tx.execute(sql`SELECT set_config('app.is_admin', 'true', true)`);
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
