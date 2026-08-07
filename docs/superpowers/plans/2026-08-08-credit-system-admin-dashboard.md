# Credit System, Premium Templates & Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give tenants a Rupiah credit balance that gates AI generation and 5 of 7 premium templates, funded by a manual top-up-and-approve flow, run through a new role-gated `/admin` panel.

**Architecture:** New Drizzle tables (`credit_transactions` ledger, `topup_requests`, `template_unlocks`) plus a `credit_balance` cache column on `tenants`. A single `debitCredit`/`creditTopup` helper wraps every balance change in one DB transaction so the ledger and the cached balance never drift. `better-auth`'s official `admin` plugin supplies `role`/`banned` on `user` and ban/unban functions — no hand-rolled auth. Admin routes get cross-tenant DB access via a new `withAdminDb()` helper + a parallel RLS policy on the 4 affected tables, mirroring the existing `withTenantRls`/`withPublicDb` pattern exactly.

**Tech Stack:** Next.js 15 API routes, Drizzle ORM (Postgres), better-auth admin plugin, Zod validation, existing `@invyte/storage` media upload endpoint (reused for payment-proof images), Vitest (new devDependency, `packages/db` only) for the money-handling unit tests.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-credit-system-admin-dashboard-design.md` — read it before starting; this plan implements it verbatim.
- No Midtrans/Xendit or any payment gateway API integration — manual proof-upload + admin approval only.
- `credit_balance` and all ledger amounts are **integer Rupiah, no decimals**.
- Every `/api/v1/admin/*` route MUST call `requireAdminSession` before touching the DB — read for `admin`+`superadmin`, write for `superadmin` only.
- RLS: every new tenant-scoped table gets `FORCE ROW LEVEL SECURITY` + the standard `current_setting('app.tenant_id', true)` policy, exactly like `media`/`invitations`/etc. Admin cross-tenant access is a second, additive permissive policy on `current_setting('app.is_admin', true)` — never an RLS bypass at the Postgres role level.
- `user`/`session`/`account`/`verification`/`tenants` keep the project's existing "no RLS, app-level check" precedent — do not add RLS to them.
- Match existing code style exactly: `uuidv7()` from `@/lib/uuid` for all new IDs (not `nanoid`, not `crypto.randomUUID`), Zod schemas for all request bodies, `NextResponse.json({ error }, { status })` for error shapes.
- All new user-facing strings are Bahasa Indonesia, matching the rest of the dashboard.

---

## Task 1: Schema — credit tables, role/ban columns, RLS

**Files:**
- Create: `packages/db/src/schema/credits.ts`
- Modify: `packages/db/src/schema/tenants.ts`
- Modify: `packages/db/src/schema/auth.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/rls.sql`
- Migration: generated via `pnpm --filter @invyte/db db:generate`

**Interfaces:**
- Produces: `tenants.creditBalance: number`, `credit_transactions` table (`creditTransactions` export), `topup_requests` table (`topupRequests` export), `template_unlocks` table (`templateUnlocks` export), `user.role: string`, `user.banned: boolean`, `user.banReason: string | null`, `user.banExpires: Date | null`, `session.impersonatedBy: string | null`. All tasks after this one import these from `@invyte/db`.

- [ ] **Step 1: Add `creditBalance` to `tenants` schema**

Edit `packages/db/src/schema/tenants.ts` — add `integer` to the drizzle-orm import and one new column:

```ts
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
```

Add inside the `tenants` column object, after `limits`:

```ts
    limits: jsonb("limits").notNull().default({}),
    creditBalance: integer("credit_balance").notNull().default(0),
```

- [ ] **Step 2: Add admin-plugin columns to `user` and `session`**

Edit `packages/db/src/schema/auth.ts`. Add `boolean` is already imported. In the `user` table, after `deletedAt`:

```ts
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    // Better Auth admin plugin
    role: text("role").notNull().default("user"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
```

In the `session` table, after `activeTenantId`:

```ts
    activeTenantId: text("active_tenant_id"),
    impersonatedBy: text("impersonated_by"),
```

- [ ] **Step 3: Create `packages/db/src/schema/credits.ts`**

```ts
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { user } from "./auth";

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "topup",
  "debit_ai_generation",
  "debit_template_unlock",
]);

export const topupRequestStatusEnum = pgEnum("topup_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: creditTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_transactions_tenant_idx").on(t.tenantId, t.createdAt)],
);

export const topupRequests = pgTable(
  "topup_requests",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    packageAmount: integer("package_amount").notNull(),
    proofImageUrl: text("proof_image_url").notNull(),
    status: topupRequestStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("topup_requests_status_idx").on(t.status, t.createdAt)],
);

export const templateUnlocks = pgTable(
  "template_unlocks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("template_unlocks_tenant_template_idx").on(t.tenantId, t.templateId)],
);

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type TopupRequest = typeof topupRequests.$inferSelect;
export type NewTopupRequest = typeof topupRequests.$inferInsert;
export type TemplateUnlock = typeof templateUnlocks.$inferSelect;
export type NewTemplateUnlock = typeof templateUnlocks.$inferInsert;
```

- [ ] **Step 4: Register the new schema file**

Edit `packages/db/src/schema/index.ts`, add after `./ai-generations`:

```ts
export * from "./ai-generations";
export * from "./checkins";
export * from "./credits";
```

(Note: `./checkins` was already last — just append `./credits` after it, keep `./checkins` where it is.)

- [ ] **Step 5: Generate the migration**

Run: `cd packages/db && pnpm db:generate`
Expected: a new file appears under `packages/db/migrations/`, e.g. `0002_<name>.sql`, containing `ALTER TABLE "tenants" ADD COLUMN "credit_balance"...`, `ALTER TABLE "user" ADD COLUMN "role"...`, `CREATE TABLE "credit_transactions"...`, `CREATE TABLE "topup_requests"...`, `CREATE TABLE "template_unlocks"...`. Read the generated file to confirm it matches — drizzle-kit sometimes asks interactive questions about column renames vs new columns; answer "create column" for all of these (they're genuinely new).

- [ ] **Step 6: Add RLS policies**

Edit `packages/db/rls.sql`. Add a new section before the closing `SELECT format(...)` summary query, after the `media` section:

```sql
-- ── credit_transactions ─────────────────────────────────────
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_transactions_tenant_iso ON credit_transactions;
CREATE POLICY credit_transactions_tenant_iso ON credit_transactions
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- Admin panel needs cross-tenant reads/writes (approve top-ups touch any
-- tenant's ledger). Set only by withAdminDb() after requireAdminSession()
-- has already checked the caller's role server-side — this is additive
-- (permissive policies OR together), not a bypass of the tenant policy.
DROP POLICY IF EXISTS credit_transactions_admin_all ON credit_transactions;
CREATE POLICY credit_transactions_admin_all ON credit_transactions
  USING (current_setting('app.is_admin', true) = 'true')
  WITH CHECK (current_setting('app.is_admin', true) = 'true');

-- ── topup_requests ───────────────────────────────────────────
ALTER TABLE topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_requests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS topup_requests_tenant_iso ON topup_requests;
CREATE POLICY topup_requests_tenant_iso ON topup_requests
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS topup_requests_admin_all ON topup_requests;
CREATE POLICY topup_requests_admin_all ON topup_requests
  USING (current_setting('app.is_admin', true) = 'true')
  WITH CHECK (current_setting('app.is_admin', true) = 'true');

-- ── template_unlocks ─────────────────────────────────────────
ALTER TABLE template_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_unlocks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS template_unlocks_tenant_iso ON template_unlocks;
CREATE POLICY template_unlocks_tenant_iso ON template_unlocks
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

DROP POLICY IF EXISTS template_unlocks_admin_all ON template_unlocks;
CREATE POLICY template_unlocks_admin_all ON template_unlocks
  USING (current_setting('app.is_admin', true) = 'true')
  WITH CHECK (current_setting('app.is_admin', true) = 'true');

-- ── memberships: admin cross-tenant read (for user-list join) ──
DROP POLICY IF EXISTS memberships_admin_read ON memberships;
CREATE POLICY memberships_admin_read ON memberships
  FOR SELECT
  USING (current_setting('app.is_admin', true) = 'true');
```

- [ ] **Step 7: Apply migration + RLS to the dev database**

Run (from repo root, with `.env` exported — `set -a && source .env && set +a`):
```bash
pnpm --filter @invyte/db db:migrate
psql "$DATABASE_URL" -f packages/db/rls.sql
```
Expected: migration applies cleanly, `rls.sql` output ends with `RLS applied: N policies across M tables` where N/M are higher than before (4 new tables + 1 new memberships policy).

- [ ] **Step 8: Typecheck and commit**

Run: `pnpm --filter @invyte/db typecheck`
Expected: no errors.

```bash
git add packages/db/src/schema/credits.ts packages/db/src/schema/tenants.ts \
  packages/db/src/schema/auth.ts packages/db/src/schema/index.ts \
  packages/db/rls.sql packages/db/migrations/
git commit -m "feat(db): add credit ledger, topup requests, template unlocks, admin role/ban columns"
```

---

## Task 2: Credit ledger helper + Vitest setup + unit tests

**Files:**
- Create: `packages/db/src/credit.ts`
- Create: `packages/db/src/uuid.ts`
- Create: `packages/db/vitest.config.ts`
- Create: `packages/db/src/credit.test.ts`
- Modify: `packages/db/package.json`

**Interfaces:**
- Consumes: `withTenantRls` from `./with-tenant`, `tenants`/`creditTransactions` from `./schema`
- Produces: `debitCredit(tenantId, amount, type, opts?): Promise<{ balanceAfter: number }>`, `creditTopup(tenantId, amount, referenceId, description?): Promise<{ balanceAfter: number }>`, `InsufficientCreditError` class. Tasks 5, 6, 7 import these from `@invyte/db`.

- [ ] **Step 1: Add Vitest devDependency and test script**

Edit `packages/db/package.json`:

```json
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/seed.ts",
    "db:studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
```

Add to `devDependencies`:
```json
    "vitest": "^3.0.0",
```

Run: `pnpm install`
Expected: `vitest` installed into `packages/db/node_modules` (hoisted at workspace root).

- [ ] **Step 2: Add `packages/db/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: { reporter: ["text"], include: ["src/credit.ts"] },
  },
});
```

- [ ] **Step 3: Add a `uuidv7` helper to `packages/db`**

`credit.ts` needs to generate `credit_transactions.id` itself (callers don't
pass one in). The existing `uuidv7()` lives at `apps/web/lib/uuid.ts`, but
`packages/db` cannot import from `apps/web` (wrong dependency direction —
apps depend on packages, never the reverse). Create
`packages/db/src/uuid.ts` with the identical implementation rather than
inventing a different ID scheme, so `credit_transactions.id` still sorts
the same way every other UUID v7 primary key in this schema does:

```ts
/**
 * UUID v7 — time-ordered, sortable. Inline implementation (no external dep).
 * Mirrors apps/web/lib/uuid.ts exactly — packages/db can't import from
 * apps/web (wrong dependency direction), so this is a deliberate duplicate
 * of that one small leaf utility, not a second ID scheme.
 */
export function uuidv7(): string {
  const now = BigInt(Date.now());
  const hi = Number((now >> BigInt(28)) & BigInt(0xffffffff));
  const mid = Number((now >> BigInt(12)) & BigInt(0xffff));
  const lo = Number(now & BigInt(0xfff));
  const rand = crypto.getRandomValues(new Uint8Array(8));
  rand[0] = (rand[0]! & 0x3f) | 0x80; // set variant bits
  const hex = (n: number, pad: number) => n.toString(16).padStart(pad, "0");
  const randHex = Array.from(rand)
    .map((b) => hex(b, 2))
    .join("");
  return `${hex(hi, 8)}-${hex(mid, 4)}-7${hex(lo, 3)}-${randHex.slice(0, 4)}-${randHex.slice(4)}`;
}
```

- [ ] **Step 4: Write the credit ledger helper**

Create `packages/db/src/credit.ts`:

```ts
import { eq, sql } from "drizzle-orm";
import { creditTransactions, tenants } from "./schema";
import { uuidv7 } from "./uuid";
import { withTenantRls } from "./with-tenant";

export class InsufficientCreditError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(`Saldo tidak cukup: butuh Rp ${required}, tersedia Rp ${available}`);
    this.name = "InsufficientCreditError";
  }
}

export type CreditTransactionType = "topup" | "debit_ai_generation" | "debit_template_unlock";

interface LedgerOpts {
  referenceType?: string;
  referenceId?: string;
  description?: string;
}

async function writeLedgerEntry(
  tenantId: string,
  amount: number,
  type: CreditTransactionType,
  opts: LedgerOpts,
): Promise<{ balanceAfter: number }> {
  return withTenantRls(tenantId, async (tx) => {
    // Row lock — serializes concurrent debits/topups for the same tenant so
    // two simultaneous requests can't both read a stale balance and both
    // succeed past zero.
    const [row] = await tx
      .select({ creditBalance: tenants.creditBalance })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .for("update");

    if (!row) throw new Error(`Tenant not found: ${tenantId}`);

    const newBalance = row.creditBalance + amount;
    if (newBalance < 0) {
      throw new InsufficientCreditError(-amount, row.creditBalance);
    }

    await tx
      .update(tenants)
      .set({ creditBalance: newBalance, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    await tx.insert(creditTransactions).values({
      id: uuidv7(),
      tenantId,
      type,
      amount,
      balanceAfter: newBalance,
      referenceType: opts.referenceType ?? null,
      referenceId: opts.referenceId ?? null,
      description: opts.description ?? null,
      createdAt: new Date(),
    });

    return { balanceAfter: newBalance };
  });
}

/**
 * Debit `amount` (positive number) from tenant's credit balance.
 * Throws InsufficientCreditError if the balance would go negative.
 */
export async function debitCredit(
  tenantId: string,
  amount: number,
  type: Exclude<CreditTransactionType, "topup">,
  opts: LedgerOpts = {},
): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error("debitCredit amount must be positive");
  return writeLedgerEntry(tenantId, -amount, type, opts);
}

/**
 * Add `amount` (positive number) to tenant's credit balance. Used only by
 * the admin top-up approval flow.
 */
export async function creditTopup(
  tenantId: string,
  amount: number,
  referenceId: string,
  description?: string,
): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error("creditTopup amount must be positive");
  return writeLedgerEntry(tenantId, amount, "topup", {
    referenceType: "topup_request",
    referenceId,
    ...(description !== undefined ? { description } : {}),
  });
}
```

Note: `.for("update")` is Drizzle's row-lock modifier (`SELECT ... FOR UPDATE`) — available on `pg` select queries.

- [ ] **Step 5: Export from package index**

Edit `packages/db/src/index.ts` — add after the existing exports:

```ts
export * from "./schema/index";
export * from "./client";
export * from "./with-tenant";
export * from "./credit";
```

- [ ] **Step 6: Write the failing tests**

Create `packages/db/src/credit.test.ts`:

```ts
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "./client";
import { creditTopup, debitCredit, InsufficientCreditError } from "./credit";
import { tenants } from "./schema";
import { eq } from "drizzle-orm";

async function makeTenant(creditBalance = 0): Promise<string> {
  const id = randomUUID();
  await db.insert(tenants).values({
    id,
    slug: `test-${id.slice(0, 8)}`,
    name: "Test Tenant",
    type: "personal",
    plan: "free",
    settings: {},
    limits: {},
    creditBalance,
  });
  return id;
}

describe("credit ledger", () => {
  const createdTenantIds: string[] = [];

  afterAll(async () => {
    for (const id of createdTenantIds) {
      await db.delete(tenants).where(eq(tenants.id, id));
    }
  });

  it("creditTopup increases balance and records a ledger row", async () => {
    const tenantId = await makeTenant(0);
    createdTenantIds.push(tenantId);

    const { balanceAfter } = await creditTopup(tenantId, 25_000, "req-1", "test topup");
    expect(balanceAfter).toBe(25_000);

    const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    expect(row?.creditBalance).toBe(25_000);
  });

  it("debitCredit decreases balance when sufficient", async () => {
    const tenantId = await makeTenant(10_000);
    createdTenantIds.push(tenantId);

    const { balanceAfter } = await debitCredit(tenantId, 5_000, "debit_ai_generation", {
      referenceId: "gen-1",
    });
    expect(balanceAfter).toBe(5_000);
  });

  it("debitCredit rejects when balance is insufficient and leaves balance unchanged", async () => {
    const tenantId = await makeTenant(1_000);
    createdTenantIds.push(tenantId);

    await expect(debitCredit(tenantId, 5_000, "debit_ai_generation")).rejects.toThrow(
      InsufficientCreditError,
    );

    const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    expect(row?.creditBalance).toBe(1_000);
  });

  it("concurrent debits don't race past zero", async () => {
    const tenantId = await makeTenant(10_000);
    createdTenantIds.push(tenantId);

    // Two concurrent debits of 6,000 each against a 10,000 balance — only
    // one can succeed, the other must see insufficient funds.
    const results = await Promise.allSettled([
      debitCredit(tenantId, 6_000, "debit_ai_generation"),
      debitCredit(tenantId, 6_000, "debit_ai_generation"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    expect(row?.creditBalance).toBe(4_000);
  });
});
```

This test suite hits the real dev Postgres via `DATABASE_URL` (same pattern the project already relies on for manual verification — there's no separate test DB configured anywhere in this repo yet). Requires `docker-compose.dev.yml` running and `.env` exported before running.

- [ ] **Step 7: Run tests to verify they pass**

Run (with `.env` exported):
```bash
cd packages/db && pnpm test
```
Expected: 4 passing tests. If `InsufficientCreditError` isn't exported correctly or the row lock doesn't serialize, the concurrency test will show 2 fulfilled/0 rejected or a balance other than 4,000 — fix `credit.ts` until it's green.

- [ ] **Step 8: Typecheck and commit**

Run: `pnpm --filter @invyte/db typecheck`

```bash
git add packages/db/src/credit.ts packages/db/src/credit.test.ts packages/db/src/uuid.ts \
  packages/db/vitest.config.ts packages/db/package.json packages/db/src/index.ts \
  pnpm-lock.yaml
git commit -m "feat(db): add credit ledger helper with concurrency-safe debit/topup"
```

---

## Task 3: better-auth admin plugin + `requireAdminSession` helper

**Files:**
- Modify: `apps/web/lib/auth.ts`
- Create: `apps/web/lib/require-admin.ts`
- Create: `apps/web/lib/auth-client.ts` (modify — add admin client plugin if the file already exists; check first)

**Interfaces:**
- Consumes: `auth` from `./auth`, `getServerSession` pattern from `./session`
- Produces: `requireAdminSession(req: NextRequest, opts?: { write?: boolean }): Promise<{ session: AuthSession } | { error: 403 | 401 }>`. Tasks 7 and 8's admin routes call this first.

- [ ] **Step 1: Enable the admin plugin in `apps/web/lib/auth.ts`**

Edit the file — add the import and the `plugins` array entry:

```ts
import { admin } from "better-auth/plugins";
```

Change:
```ts
  plugins: [nextCookies()],
```
to:
```ts
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["superadmin", "admin"],
    }),
    nextCookies(),
  ],
```

(`nextCookies()` must stay last — it's documented as needing to run after other plugins.)

- [ ] **Step 2: Check for an existing auth client file and add the admin client plugin**

Run: `cat apps/web/lib/auth-client.ts 2>/dev/null || echo "not found"`

If it exists, add the matching client plugin so `signOut`/other client calls keep working and admin client methods (`authClient.admin.banUser` etc.) become available. Read the file first, then add:

```ts
import { adminClient } from "better-auth/client/plugins";
```

and add `adminClient()` to its `plugins` array (same pattern as the server side). This step's exact diff depends on the file's current content — read it before editing; do not guess its shape.

- [ ] **Step 3: Write the `requireAdminSession` helper**

Create `apps/web/lib/require-admin.ts`:

```ts
import type { NextRequest } from "next/server";
import { auth } from "./auth";
import type { AuthSession } from "./session";

export type AdminAuthResult = { ok: true; session: AuthSession } | { ok: false; status: 401 | 403 };

const ADMIN_ROLES = new Set(["superadmin", "admin"]);

/**
 * Gate for every /api/v1/admin/* route. Read access (write: false, the
 * default) is granted to both "admin" and "superadmin". Mutating actions
 * (write: true) require "superadmin" — "admin" gets 403.
 */
export async function requireAdminSession(
  req: NextRequest,
  opts: { write?: boolean } = {},
): Promise<AdminAuthResult> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return { ok: false, status: 401 };

  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) return { ok: false, status: 403 };
  if (opts.write && role !== "superadmin") return { ok: false, status: 403 };

  return { ok: true, session: session as AuthSession };
}
```

- [ ] **Step 4: Add `withAdminDb` to `packages/db`**

Edit `packages/db/src/with-tenant.ts`, add after `withPublicDb`:

```ts
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
```

- [ ] **Step 5: Add middleware gate for `/admin` paths**

Edit `apps/web/middleware.ts`. Add a new branch before the `isTenantPath` check (the `admin` slug is already in `RESERVED_SLUGS`, so `isTenantPath("/admin/...")` already returns `false` — this new branch must come first or `/admin` paths just fall through unguarded to `NextResponse.next()`):

```ts
  // Public paths — no auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Admin panel — requires a session; role is checked again server-side in
  // requireAdminSession() (this is just the fast reject for anonymous
  // requests, matching the same two-layer pattern as the tenant dashboard).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Tenant-scoped paths — check session for dashboard routes
  if (isTenantPath(pathname)) {
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @invyte/web typecheck && pnpm --filter @invyte/db typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/auth.ts apps/web/lib/require-admin.ts apps/web/lib/auth-client.ts \
  apps/web/middleware.ts packages/db/src/with-tenant.ts
git commit -m "feat(auth): enable better-auth admin plugin, add admin session gate"
```

---

## Task 4: Pricing constants + premium template flags + access helper

**Files:**
- Create: `apps/web/lib/pricing.ts`
- Modify: `packages/templates/src/index.ts`
- Create: `apps/web/lib/template-access.ts`

**Interfaces:**
- Produces: `AI_GENERATION_COST_RUPIAH`, `TEMPLATE_UNLOCK_COST_RUPIAH`, `TOPUP_PACKAGES_RUPIAH` from `pricing.ts`; `TemplateMeta.isPremium: boolean` from `@invyte/templates`; `assertTemplateAccess(tenantId, templateId): Promise<void>` (throws `TemplateLockedError`) from `template-access.ts`. Tasks 5, 6, 10 consume these.

- [ ] **Step 1: Create the pricing constants file**

Create `apps/web/lib/pricing.ts`:

```ts
export const AI_GENERATION_COST_RUPIAH = 5_000;
export const TEMPLATE_UNLOCK_COST_RUPIAH = 15_000;
export const TOPUP_PACKAGES_RUPIAH = [25_000, 100_000, 500_000] as const;
```

- [ ] **Step 2: Add `isPremium` to `TemplateMeta` and the 7 entries**

Edit `packages/templates/src/index.ts`. Change the interface:

```ts
export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  tags: string[];
  previewImageUrl?: string;
  isPremium: boolean;
}
```

Add `isPremium: false` to `minimalist-modern` and `islamic-elegant`, `isPremium: true` to the other 5 (`floral-classic`, `tropical-bali`, `royal-java`, `serene-garden`, `ai-composer`). Example for the first two entries (repeat the pattern for the rest, verbatim per the table below):

```ts
export const TEMPLATES: TemplateMeta[] = [
  {
    id: "minimalist-modern",
    name: "Minimalist Modern",
    description: "Bersih, kontemporer, elegan. Cocok untuk pasangan modern.",
    primaryColor: "#6b8f6e",
    accentColor: "#6b8f6e",
    tags: ["modern", "minimalis", "hijau"],
    isPremium: false,
  },
  {
    id: "floral-classic",
    name: "Floral Classic",
    description: "Romantis dengan sentuhan bunga dan warna krem hangat.",
    primaryColor: "#c4826a",
    accentColor: "#f5ede8",
    tags: ["romantis", "floral", "klasik"],
    isPremium: true,
  },
```

| id | isPremium |
|---|---|
| minimalist-modern | `false` |
| floral-classic | `true` |
| islamic-elegant | `false` |
| tropical-bali | `true` |
| royal-java | `true` |
| serene-garden | `true` |
| ai-composer | `true` |

- [ ] **Step 3: Write the template access helper**

Create `apps/web/lib/template-access.ts`. Both queries go through `withTenantRls(tenantId, ...)`, not the plain `db` export — `templateUnlocks` has `FORCE ROW LEVEL SECURITY` (Task 1), so an unscoped query would silently return zero rows instead of the real data:

```ts
import { TEMPLATES } from "@invyte/templates";
import { templateUnlocks, withTenantRls } from "@invyte/db";
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
      .where(and(eq(templateUnlocks.tenantId, tenantId), eq(templateUnlocks.templateId, templateId)))
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
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @invyte/templates typecheck && pnpm --filter @invyte/web typecheck`
Expected: no errors. (The templates package typecheck will fail until all 7 `TEMPLATES` entries have `isPremium` — Zod/TS won't catch a missing object property on an array literal typed as `TemplateMeta[]` unless strict — verify by reading the file back after editing that all 7 have the field.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/pricing.ts apps/web/lib/template-access.ts packages/templates/src/index.ts
git commit -m "feat: add pricing constants and premium template gating helper"
```

---

## Task 5: Wire AI generation route to the credit ledger

**Files:**
- Modify: `apps/web/app/api/v1/invitations/[id]/ai/generate/route.ts`

**Interfaces:**
- Consumes: `debitCredit`, `InsufficientCreditError` from `@invyte/db`; `AI_GENERATION_COST_RUPIAH` from `@/lib/pricing`

- [ ] **Step 1: Add the balance check before the cost-cap check**

Edit the route. Add imports:

```ts
import { debitCredit, InsufficientCreditError } from "@invyte/db";
import { AI_GENERATION_COST_RUPIAH } from "@/lib/pricing";
```

After the existing per-tenant $5 cost-cap block (the `if (totalCost >= 5.0)` check) and before "Create ai_generation record in pending state", insert:

```ts
  // Credit balance check — AI generation costs credits, checked before we
  // even create the pending row.
  const [tenantRow] = await db
    .select({ creditBalance: tenants.creditBalance })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenantRow || tenantRow.creditBalance < AI_GENERATION_COST_RUPIAH) {
    return NextResponse.json(
      {
        error: `Saldo tidak cukup. Butuh Rp ${AI_GENERATION_COST_RUPIAH.toLocaleString("id-ID")}, tersedia Rp ${(tenantRow?.creditBalance ?? 0).toLocaleString("id-ID")}.`,
      },
      { status: 402 },
    );
  }
```

- [ ] **Step 2: Debit after a successful generation**

In the `try` block, right before `return NextResponse.json({ generationId, variants: result.variants });`, insert:

```ts
    await debitCredit(tenantId, AI_GENERATION_COST_RUPIAH, "debit_ai_generation", {
      referenceType: "ai_generation",
      referenceId: generationId,
      description: `AI generation (${result.model})`,
    });
```

Do not debit in the `catch` block — a failed generation shouldn't cost the tenant anything. If `debitCredit` itself throws `InsufficientCreditError` here (a race between the pre-check and this point — extremely unlikely but the row lock in `debitCredit` makes it authoritative either way), let it propagate to the outer catch and surface as a 500; this is an acceptable rare edge case given the pre-check already gates the common path, and is not worth a third code path for something the row lock already prevents from corrupting the balance.

- [ ] **Step 3: Manual verification**

With the dev server running and a tenant that has `creditBalance = 0` (fresh dev DB tenants default to 0 per the Step 1 migration), trigger AI generation from the dashboard's AI composer UI. Expected: a 402 response, dashboard should surface the error message. Then manually set `creditBalance` to `10000` for that tenant via `psql`, retry — expected: generation succeeds, `credit_transactions` gets a `debit_ai_generation` row of `-5000`, `tenants.credit_balance` becomes `5000`.

- [ ] **Step 4: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/invitations/\[id\]/ai/generate/route.ts
git commit -m "feat(ai): gate AI generation behind credit balance"
```

---

## Task 6: Template unlock route + server-side gate on invitation routes

**Files:**
- Create: `apps/web/app/api/v1/tenant/templates/[templateId]/unlock/route.ts`
- Modify: `apps/web/app/api/v1/invitations/route.ts`
- Modify: `apps/web/app/api/v1/invitations/[id]/route.ts`

**Interfaces:**
- Consumes: `assertTemplateAccess`, `TemplateLockedError`, `UnknownTemplateError` from `@/lib/template-access`; `debitCredit`, `InsufficientCreditError`, `templateUnlocks` from `@invyte/db`; `TEMPLATE_UNLOCK_COST_RUPIAH` from `@/lib/pricing`
- Produces: `POST /api/v1/tenant/templates/[templateId]/unlock` — body `{ tenantSlug }`, returns `{ ok: true, balanceAfter }` or 402/404/409

- [ ] **Step 1: Create the unlock route**

Create `apps/web/app/api/v1/tenant/templates/[templateId]/unlock/route.ts`:

```ts
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
import { db, debitCredit, InsufficientCreditError, memberships, templateUnlocks, tenants } from "@invyte/db";
import { TEMPLATES } from "@invyte/templates";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ tenantSlug: z.string().min(1) });

type Ctx = { params: Promise<{ templateId: string }> };

async function resolveTenantId(tenantSlug: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(eq(tenants.slug, tenantSlug), eq(memberships.userId, userId), isNull(tenants.deletedAt)),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const tenantId = await resolveTenantId(parsed.data.tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const meta = TEMPLATES.find((t) => t.id === templateId);
  if (!meta) return NextResponse.json({ error: "Template tidak dikenal" }, { status: 404 });
  if (!meta.isPremium) {
    return NextResponse.json({ error: "Template ini sudah gratis" }, { status: 409 });
  }

  const [existing] = await db
    .select({ id: templateUnlocks.id })
    .from(templateUnlocks)
    .where(and(eq(templateUnlocks.tenantId, tenantId), eq(templateUnlocks.templateId, templateId)))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "Template sudah di-unlock" }, { status: 409 });
  }

  try {
    const { balanceAfter } = await debitCredit(
      tenantId,
      TEMPLATE_UNLOCK_COST_RUPIAH,
      "debit_template_unlock",
      { referenceType: "template_unlock", referenceId: templateId, description: `Unlock ${meta.name}` },
    );

    await db.insert(templateUnlocks).values({
      id: uuidv7(),
      tenantId,
      templateId,
      unlockedAt: new Date(),
    });

    return NextResponse.json({ ok: true, balanceAfter });
  } catch (err) {
    if (err instanceof InsufficientCreditError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }
}
```

- [ ] **Step 2: Gate `POST /api/v1/invitations` (create)**

Edit `apps/web/app/api/v1/invitations/route.ts`. Add import:

```ts
import { assertTemplateAccess, TemplateLockedError, UnknownTemplateError } from "@/lib/template-access";
```

In the `POST` handler, after `const tenantId = await resolveTenantId(...)` and its Forbidden check, before computing `slug`, insert:

```ts
  const resolvedTemplateId = templateId ?? "minimalist-modern";
  try {
    await assertTemplateAccess(tenantId, resolvedTemplateId);
  } catch (err) {
    if (err instanceof TemplateLockedError) {
      return NextResponse.json({ error: "Template ini belum di-unlock" }, { status: 402 });
    }
    if (err instanceof UnknownTemplateError) {
      return NextResponse.json({ error: "Template tidak dikenal" }, { status: 404 });
    }
    throw err;
  }
```

Then change the `templateId: templateId ?? "minimalist-modern",` line inside the `.values({...})` call to `templateId: resolvedTemplateId,` (reuse the variable instead of recomputing).

- [ ] **Step 3: Gate `PATCH /api/v1/invitations/[id]` (update)**

Edit `apps/web/app/api/v1/invitations/[id]/route.ts`. Add the same import. In the `PATCH` handler, after `const existing = await getInvitation(tenantId, id);` and its Not-found check, before the slug-conflict check, insert:

```ts
  if (updates.templateId && updates.templateId !== existing.templateId) {
    try {
      await assertTemplateAccess(tenantId, updates.templateId);
    } catch (err) {
      if (err instanceof TemplateLockedError) {
        return NextResponse.json({ error: "Template ini belum di-unlock" }, { status: 402 });
      }
      if (err instanceof UnknownTemplateError) {
        return NextResponse.json({ error: "Template tidak dikenal" }, { status: 404 });
      }
      throw err;
    }
  }
```

- [ ] **Step 4: Manual verification**

With a tenant that has 0 unlocks: `POST /api/v1/invitations` with `templateId: "floral-classic"` → expect 402. Unlock it via the new unlock route (with sufficient balance) → retry create → expect success. Attempt to unlock the same template again → expect 409.

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/tenant/templates apps/web/app/api/v1/invitations/route.ts \
  apps/web/app/api/v1/invitations/\[id\]/route.ts
git commit -m "feat: add template unlock route and server-side premium template gate"
```

---

## Task 7: Top-up request route + admin approve/reject routes

**Files:**
- Create: `apps/web/app/api/v1/tenant/topup-requests/route.ts`
- Create: `apps/web/app/api/v1/admin/topup-requests/route.ts`
- Create: `apps/web/app/api/v1/admin/topup-requests/[id]/approve/route.ts`
- Create: `apps/web/app/api/v1/admin/topup-requests/[id]/reject/route.ts`

**Interfaces:**
- Consumes: `requireAdminSession` from `@/lib/require-admin`; `withAdminDb`, `topupRequests`, `creditTopup` from `@invyte/db`; `TOPUP_PACKAGES_RUPIAH` from `@/lib/pricing`
- Produces: `POST /api/v1/tenant/topup-requests`, `GET/POST /api/v1/admin/topup-requests`, `POST .../[id]/approve`, `POST .../[id]/reject`

- [ ] **Step 1: Tenant-facing submit route**

Create `apps/web/app/api/v1/tenant/topup-requests/route.ts`:

```ts
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { TOPUP_PACKAGES_RUPIAH } from "@/lib/pricing";
import { db, memberships, tenants, topupRequests, withTenantRls } from "@invyte/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  tenantSlug: z.string().min(1),
  packageAmount: z.number().int().refine((v) => (TOPUP_PACKAGES_RUPIAH as readonly number[]).includes(v), {
    message: "packageAmount harus salah satu paket yang tersedia",
  }),
  proofImageUrl: z.string().url(),
});

async function resolveTenantId(tenantSlug: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(eq(tenants.slug, tenantSlug), eq(memberships.userId, userId), isNull(tenants.deletedAt)),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await withTenantRls(tenantId, (tx) =>
    tx
      .select()
      .from(topupRequests)
      .where(eq(topupRequests.tenantId, tenantId))
      .orderBy(desc(topupRequests.createdAt)),
  );

  return NextResponse.json({ topupRequests: rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { tenantSlug, packageAmount, proofImageUrl } = parsed.data;
  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = uuidv7();
  const [created] = await withTenantRls(tenantId, (tx) =>
    tx
      .insert(topupRequests)
      .values({
        id,
        tenantId,
        userId: session.user.id,
        packageAmount,
        proofImageUrl,
        status: "pending",
        createdAt: new Date(),
      })
      .returning(),
  );

  return NextResponse.json({ topupRequest: created }, { status: 201 });
}
```

- [ ] **Step 2: Admin list route**

Create `apps/web/app/api/v1/admin/topup-requests/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { desc, eq } from "drizzle-orm";
import { tenants, topupRequests, user, withAdminDb } from "@invyte/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const statusFilter = req.nextUrl.searchParams.get("status");

  const rows = await withAdminDb((tx) => {
    const base = tx
      .select({
        request: topupRequests,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        userEmail: user.email,
      })
      .from(topupRequests)
      .innerJoin(tenants, eq(topupRequests.tenantId, tenants.id))
      .innerJoin(user, eq(topupRequests.userId, user.id))
      .orderBy(desc(topupRequests.createdAt));

    return statusFilter
      ? base.where(eq(topupRequests.status, statusFilter as "pending" | "approved" | "rejected"))
      : base;
  });

  return NextResponse.json({ topupRequests: rows });
}
```

- [ ] **Step 3: Approve route**

Create `apps/web/app/api/v1/admin/topup-requests/[id]/approve/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { creditTopup, topupRequests, withAdminDb } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  const [request] = await withAdminDb((tx) =>
    tx.select().from(topupRequests).where(eq(topupRequests.id, id)).limit(1),
  );
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request sudah diproses" }, { status: 409 });
  }

  // creditTopup uses withTenantRls internally, scoped to the request's own
  // tenant — no cross-tenant write needed for the ledger/balance side.
  await creditTopup(request.tenantId, request.packageAmount, request.id, "Top-up disetujui admin");

  const [updated] = await withAdminDb((tx) =>
    tx
      .update(topupRequests)
      .set({ status: "approved", reviewedBy: auth.session.user.id, reviewedAt: new Date() })
      .where(eq(topupRequests.id, id))
      .returning(),
  );

  return NextResponse.json({ topupRequest: updated });
}
```

- [ ] **Step 4: Reject route**

Create `apps/web/app/api/v1/admin/topup-requests/[id]/reject/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { topupRequests, withAdminDb } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const [request] = await withAdminDb((tx) =>
    tx.select().from(topupRequests).where(eq(topupRequests.id, id)).limit(1),
  );
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request sudah diproses" }, { status: 409 });
  }

  const [updated] = await withAdminDb((tx) =>
    tx
      .update(topupRequests)
      .set({
        status: "rejected",
        reviewedBy: auth.session.user.id,
        reviewedAt: new Date(),
        rejectionReason: parsed.data.reason,
      })
      .where(eq(topupRequests.id, id))
      .returning(),
  );

  return NextResponse.json({ topupRequest: updated });
}
```

- [ ] **Step 5: Manual verification**

As a regular tenant user: submit a top-up request (via curl or the UI built in Task 9) → row appears with `status: pending`. As a non-admin logged-in user: `GET /api/v1/admin/topup-requests` → expect 403. Promote a test user to `role: admin` directly in the DB, retry the same GET → expect 200 with the list (read works for `admin`). Try `POST .../approve` as that `admin` user → expect 403 (write requires `superadmin`). Promote to `role: superadmin`, retry approve → expect 200, and confirm `tenants.credit_balance` increased by `packageAmount` and a `credit_transactions` row of type `topup` was created.

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/tenant/topup-requests apps/web/app/api/v1/admin/topup-requests
git commit -m "feat: add topup request submission and admin approve/reject routes"
```

---

## Task 8: Admin users, transactions, overview routes

**Files:**
- Create: `apps/web/app/api/v1/admin/users/route.ts`
- Create: `apps/web/app/api/v1/admin/users/[id]/ban/route.ts`
- Create: `apps/web/app/api/v1/admin/users/[id]/unban/route.ts`
- Create: `apps/web/app/api/v1/admin/transactions/route.ts`
- Create: `apps/web/app/api/v1/admin/overview/route.ts`

**Interfaces:**
- Consumes: `requireAdminSession`, `withAdminDb`, `auth` (for `auth.api.banUser`/`unbanUser`)

- [ ] **Step 1: Users list route**

Create `apps/web/app/api/v1/admin/users/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { memberships, tenants, user, withAdminDb } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const users = await withAdminDb((tx) => tx.select().from(user).orderBy(user.createdAt));

  const membershipRows = await withAdminDb((tx) =>
    tx
      .select({
        userId: memberships.userId,
        role: memberships.role,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id)),
  );

  const tenantsByUser = new Map<string, typeof membershipRows>();
  for (const row of membershipRows) {
    const list = tenantsByUser.get(row.userId) ?? [];
    list.push(row);
    tenantsByUser.set(row.userId, list);
  }

  const result = users.map((u) => ({
    ...u,
    tenants: tenantsByUser.get(u.id) ?? [],
  }));

  return NextResponse.json({ users: result });
}
```

- [ ] **Step 2: Ban/unban routes**

Create `apps/web/app/api/v1/admin/users/[id]/ban/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { requireAdminSession } from "@/lib/require-admin";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ reason: z.string().min(1).max(500).optional() });

export async function POST(req: NextRequest, ctx: Ctx) {
  const adminAuth = await requireAdminSession(req, { write: true });
  if (!adminAuth.ok) return NextResponse.json({ error: "Forbidden" }, { status: adminAuth.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  await auth.api.banUser({
    body: { userId: id, banReason: parsed.data.reason ?? "Dibanned oleh admin" },
    headers: req.headers,
  });

  return NextResponse.json({ ok: true });
}
```

Create `apps/web/app/api/v1/admin/users/[id]/unban/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { requireAdminSession } from "@/lib/require-admin";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const adminAuth = await requireAdminSession(req, { write: true });
  if (!adminAuth.ok) return NextResponse.json({ error: "Forbidden" }, { status: adminAuth.status });

  const { id } = await ctx.params;
  await auth.api.unbanUser({ body: { userId: id }, headers: req.headers });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Transactions list route**

Create `apps/web/app/api/v1/admin/transactions/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { creditTransactions, tenants, withAdminDb } from "@invyte/db";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const typeFilter = req.nextUrl.searchParams.get("type");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);

  const rows = await withAdminDb((tx) => {
    const base = tx
      .select({ transaction: creditTransactions, tenantName: tenants.name, tenantSlug: tenants.slug })
      .from(creditTransactions)
      .innerJoin(tenants, eq(creditTransactions.tenantId, tenants.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);

    return typeFilter
      ? base.where(eq(creditTransactions.type, typeFilter as "topup" | "debit_ai_generation" | "debit_template_unlock"))
      : base;
  });

  return NextResponse.json({ transactions: rows });
}
```

- [ ] **Step 4: Overview metrics route**

Create `apps/web/app/api/v1/admin/overview/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { aiGenerations, creditTransactions, tenants, topupRequests, withAdminDb } from "@invyte/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [revenueRow] = await withAdminDb((tx) =>
    tx
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(creditTransactions)
      .where(and(eq(creditTransactions.type, "topup"), gte(creditTransactions.createdAt, startOfMonth))),
  );

  const [activeTenantsRow] = await withAdminDb((tx) =>
    tx.select({ count: sql<string>`COUNT(*)` }).from(tenants).where(isNull(tenants.deletedAt)),
  );

  const [pendingTopupsRow] = await withAdminDb((tx) =>
    tx
      .select({ count: sql<string>`COUNT(*)` })
      .from(topupRequests)
      .where(eq(topupRequests.status, "pending")),
  );

  const [aiGenerationsRow] = await withAdminDb((tx) =>
    tx
      .select({ count: sql<string>`COUNT(*)` })
      .from(aiGenerations)
      .where(and(gte(aiGenerations.createdAt, startOfMonth), eq(aiGenerations.status, "done"))),
  );

  return NextResponse.json({
    revenueThisMonth: Number(revenueRow?.total ?? 0),
    activeTenants: Number(activeTenantsRow?.count ?? 0),
    pendingTopupRequests: Number(pendingTopupsRow?.count ?? 0),
    aiGenerationsThisMonth: Number(aiGenerationsRow?.count ?? 0),
  });
}
```

Note: `aiGenerations`/`tenants`/`topupRequests` reads here also go through `withAdminDb` for consistency even though `tenants` itself has no RLS (the wrapper is harmless — it just also sets `app.tenant_id` to empty, matching existing `withPublicDb` behavior on tables without RLS).

- [ ] **Step 5: Manual verification**

As `superadmin`: `GET /api/v1/admin/users` → list includes the test users created earlier, each with their `tenants` array populated. Ban one via the ban route, `GET` again → confirm `banned: true`. `GET /api/v1/admin/transactions` → confirm the `topup` and `debit_ai_generation` rows from earlier tasks appear, joined with tenant name. `GET /api/v1/admin/overview` → confirm the 4 numbers look sane against what you created manually in earlier tasks.

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/admin/users apps/web/app/api/v1/admin/transactions apps/web/app/api/v1/admin/overview
git commit -m "feat: add admin users, transactions, overview routes"
```

---

## Task 9: Tenant-facing UI — credit balance widget + top-up page

**Files:**
- Modify: `apps/web/components/dashboard/header.tsx`
- Modify: `apps/web/components/dashboard/shell.tsx`
- Modify: `apps/web/app/[tenant]/dashboard/layout.tsx`
- Create: `apps/web/app/[tenant]/dashboard/billing/page.tsx`
- Create: `apps/web/components/billing/topup-form.tsx`

**Interfaces:**
- Consumes: `TOPUP_PACKAGES_RUPIAH` from `@/lib/pricing`, existing `/api/v1/media/upload` and new `/api/v1/tenant/topup-requests` endpoints

- [ ] **Step 1: Thread `creditBalance` through the dashboard shell**

Edit `apps/web/app/[tenant]/dashboard/layout.tsx` — pass the field through (it's already selected by `getTenantBySlug`'s `select()`, no query change needed):

```tsx
  return (
    <DashboardShell
      user={session.user}
      tenantSlug={tenant}
      tenantName={tenantRecord.name}
      creditBalance={tenantRecord.creditBalance}
    >
      {children}
    </DashboardShell>
  );
```

Edit `apps/web/components/dashboard/shell.tsx`:

```tsx
interface Props {
  children: React.ReactNode;
  user: DbUser;
  tenantSlug: string;
  tenantName: string;
  creditBalance: number;
}

export function DashboardShell({ children, user, tenantSlug, tenantName, creditBalance }: Props) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        tenantSlug={tenantSlug}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader
          user={user}
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          creditBalance={creditBalance}
          onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the balance widget to the header**

Edit `apps/web/components/dashboard/header.tsx`. Add `Wallet` to the `lucide-react` import, add `creditBalance` to `DashboardHeaderProps` and the destructure, add `tenantSlug` usage for the link href:

```tsx
import { signOut } from "@/lib/auth-client";
import type { User as DbUser } from "@invyte/db";
import { ChevronDown, LogOut, Menu, User, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardHeaderProps {
  user: DbUser;
  tenantSlug: string;
  tenantName: string;
  creditBalance: number;
  onMobileMenuToggle?: () => void;
}

export function DashboardHeader({
  user,
  tenantSlug,
  tenantName,
  creditBalance,
  onMobileMenuToggle,
}: DashboardHeaderProps) {
```

Inside the `<header>`, before the `<div className="relative">` (the user menu), add:

```tsx
        <Link
          href={`/${tenantSlug}/dashboard/billing`}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
        >
          <Wallet className="h-3.5 w-3.5" />
          Rp {creditBalance.toLocaleString("id-ID")}
        </Link>
```

Place it as a sibling right before the closing `</div>` of the left-side `flex items-center gap-3` block, so it sits between the workspace name and the user menu — i.e. add it as the last child inside that first `<div className="flex items-center gap-3 min-w-0">`.

- [ ] **Step 3: Build the top-up form component**

Create `apps/web/components/billing/topup-form.tsx`:

```tsx
"use client";

import { TOPUP_PACKAGES_RUPIAH } from "@/lib/pricing";
import { useRef, useState } from "react";

interface Props {
  tenantSlug: string;
  tenantId: string;
}

export function TopupForm({ tenantSlug, tenantId }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<number>(TOPUP_PACKAGES_RUPIAH[0]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Upload bukti transfer terlebih dahulu");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("type", "image");

      const uploadRes = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const body = (await uploadRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Upload bukti transfer gagal");
      }
      const { url } = (await uploadRes.json()) as { url: string };

      setUploading(false);
      setSubmitting(true);

      const res = await fetch("/api/v1/tenant/topup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, packageAmount: selectedPackage, proofImageUrl: url }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Gagal mengirim permintaan top-up");
      }

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">Permintaan top-up terkirim.</p>
        <p className="text-muted-foreground mt-1">
          Menunggu verifikasi admin. Saldo akan otomatis bertambah setelah disetujui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Pilih Paket</p>
        <div className="grid grid-cols-3 gap-2">
          {TOPUP_PACKAGES_RUPIAH.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setSelectedPackage(amount)}
              className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ${
                selectedPackage === amount
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              Rp {amount.toLocaleString("id-ID")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
        <p className="font-medium">Transfer ke:</p>
        <p className="text-muted-foreground">[ISI NOMOR REKENING DI SINI]</p>
        <p className="text-muted-foreground">[ISI QRIS/INFO PEMBAYARAN LAIN DI SINI]</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="proof-upload" className="text-sm font-medium">
          Bukti Transfer
        </label>
        <input
          id="proof-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || submitting}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Mengunggah bukti..." : submitting ? "Mengirim..." : "Kirim Permintaan Top-Up"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Build the billing page**

Create `apps/web/app/[tenant]/dashboard/billing/page.tsx`:

```tsx
import { TopupForm } from "@/components/billing/topup-form";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function BillingPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saldo & Top-Up</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Saldo saat ini: <span className="font-medium">Rp {tenantRecord.creditBalance.toLocaleString("id-ID")}</span>
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <TopupForm tenantSlug={tenant} tenantId={tenantRecord.id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

Load any tenant dashboard page — confirm the `Rp X` balance pill appears in the header and links to `/[tenant]/dashboard/billing`. On the billing page, pick a package, upload an image, submit — confirm the request appears in `topup_requests` with the right `package_amount` and a valid `proof_image_url` pointing at the MinIO bucket.

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/components/dashboard/header.tsx apps/web/components/dashboard/shell.tsx \
  apps/web/app/\[tenant\]/dashboard/layout.tsx apps/web/app/\[tenant\]/dashboard/billing \
  apps/web/components/billing
git commit -m "feat(dashboard): add credit balance widget and top-up page"
```

---

## Task 10: Template picker UI gating

**Files:**
- Modify: `apps/web/app/[tenant]/dashboard/invitations/new/page.tsx`
- Modify: `apps/web/components/invitations/new-invitation-form.tsx`
- Modify: `apps/web/components/invitations/editor-sections/editor-theme.tsx`

**Interfaces:**
- Consumes: `getUnlockedTemplateIds` from `@/lib/template-access`; new `POST /api/v1/tenant/templates/[templateId]/unlock` from Task 6

- [ ] **Step 1: Pass unlocked template IDs and credit balance into the new-invitation page**

Edit `apps/web/app/[tenant]/dashboard/invitations/new/page.tsx`:

```tsx
import { NewInvitationForm } from "@/components/invitations/new-invitation-form";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { getUnlockedTemplateIds } from "@/lib/template-access";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function NewInvitationPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const unlockedTemplateIds = await getUnlockedTemplateIds(tenantRecord.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Kembali ke Undangan
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Buat Undangan Baru</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pilih template dan isi informasi dasar undangan Anda.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <NewInvitationForm
          tenantSlug={tenant}
          tenantId={tenantRecord.id}
          creditBalance={tenantRecord.creditBalance}
          unlockedTemplateIds={unlockedTemplateIds}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Gate the template picker in `NewInvitationForm`**

Edit `apps/web/components/invitations/new-invitation-form.tsx`. Add `TEMPLATE_UNLOCK_COST_RUPIAH` import and extend `Props`:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
import { TEMPLATES } from "@invyte/templates";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
```

```tsx
interface Props {
  tenantSlug: string;
  tenantId: string;
  creditBalance: number;
  unlockedTemplateIds: string[];
}

export function NewInvitationForm({ tenantSlug, tenantId, creditBalance, unlockedTemplateIds }: Props) {
```

Add state for tracking unlocks made during this session (so the UI updates without a full page reload) and an unlock handler, right after the existing `const [error, setError] = useState<string | null>(null);`:

```tsx
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(unlockedTemplateIds));
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  async function handleUnlock(templateId: string) {
    setUnlockError(null);
    setUnlocking(templateId);
    try {
      const res = await fetch(`/api/v1/tenant/templates/${templateId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Gagal unlock template");
      }
      setUnlocked((prev) => new Set(prev).add(templateId));
      setValue("templateId", templateId, { shouldValidate: true });
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUnlocking(null);
    }
  }
```

Replace the template picker `<button>` block's contents to show the lock state — the `onClick` becomes conditional and a lock badge appears for locked premium templates:

```tsx
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const isLocked = t.isPremium && !unlocked.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (isLocked) {
                    void handleUnlock(t.id);
                  } else {
                    setValue("templateId", t.id, { shouldValidate: true });
                  }
                }}
                disabled={unlocking === t.id}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  selectedTemplate === t.id
                    ? "border-primary shadow-md ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                } ${unlocking === t.id ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full shrink-0"
                      style={{ backgroundColor: t.primaryColor }}
                    />
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  {isLocked && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      🔒 Rp {TEMPLATE_UNLOCK_COST_RUPIAH.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                {isLocked && unlocking === t.id && (
                  <p className="mt-2 text-xs text-muted-foreground">Membuka template...</p>
                )}
              </button>
            );
          })}
        </div>
        {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
```

`creditBalance` is accepted as a prop for a future low-balance warning but isn't required to make the gating correct (the server route is the real check) — leave it destructured and unused is a lint error, so reference it minimally: add a small note under the picker:

```tsx
        <p className="text-xs text-muted-foreground">
          Saldo Anda: Rp {creditBalance.toLocaleString("id-ID")}
        </p>
```

Place this line right after the closing `</div>` of the templates grid, before the `{unlockError && ...}` line.

- [ ] **Step 3: Same gating in `EditorTheme`**

Edit `apps/web/components/invitations/editor-sections/editor-theme.tsx`. This component is used inside the existing invitation editor — find its parent to also pass `unlockedTemplateIds`/`creditBalance` (search: `grep -rn "EditorTheme" apps/web/app apps/web/components` to find the caller before editing, since this plan hasn't inspected that parent file — read it, then thread the two new props through exactly like Step 1 did for the new-invitation page, reusing `getUnlockedTemplateIds(tenantId)`).

Add the same `isPremium`/lock-badge treatment to this component's template list:

```tsx
"use client";

import type { ThemeConfig } from "@invyte/templates";
import { TEMPLATES } from "@invyte/templates";
import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  theme: ThemeConfig;
  templateId: string;
  onThemeChange: (patch: Partial<ThemeConfig>) => void;
  onTemplateChange: (id: string) => void;
  tenantId: string;
  tenantSlug: string;
  unlockedTemplateIds: string[];
}

export function EditorTheme({
  theme,
  templateId,
  onThemeChange,
  onTemplateChange,
  tenantId,
  tenantSlug,
  unlockedTemplateIds,
}: Props) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(unlockedTemplateIds));
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  async function handleUnlock(id: string) {
    setUnlockError(null);
    setUnlocking(id);
    try {
      const res = await fetch(`/api/v1/tenant/templates/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Gagal unlock template");
      }
      setUnlocked((prev) => new Set(prev).add(id));
      onTemplateChange(id);
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUnlocking(null);
    }
  }
```

Replace the template selector block (the first `<div className="space-y-2">...Template...</div>`) with:

```tsx
      {/* Template selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Template</p>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => {
            const isLocked = t.isPremium && !unlocked.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => (isLocked ? void handleUnlock(t.id) : onTemplateChange(t.id))}
                disabled={unlocking === t.id}
                className={`rounded-lg border px-3 py-2 text-left text-sm flex items-center justify-between gap-3 transition-all ${
                  templateId === t.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:border-primary/40"
                } ${unlocking === t.id ? "opacity-60" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: t.primaryColor }}
                  />
                  {t.name}
                </span>
                {isLocked && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 shrink-0">
                    🔒 Rp {TEMPLATE_UNLOCK_COST_RUPIAH.toLocaleString("id-ID")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
      </div>
```

- [ ] **Step 4: Thread `unlockedTemplateIds` through `InvitationEditor` to `EditorTheme`**

The chain is: `app/[tenant]/dashboard/invitations/[id]/page.tsx` (server component, has `tenantRecord.id`) → `components/invitations/invitation-editor.tsx` (client component, `Props { invitation, tenantSlug }`) → `components/invitations/editor-sections/editor-theme.tsx` (Step 3 above).

Edit `apps/web/app/[tenant]/dashboard/invitations/[id]/page.tsx`:

```tsx
import { InvitationEditor } from "@/components/invitations/invitation-editor";
import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { getUnlockedTemplateIds } from "@/lib/template-access";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

export default async function InvitationEditorPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  const unlockedTemplateIds = await getUnlockedTemplateIds(tenantRecord.id);

  return (
    <InvitationEditor
      invitation={invitation}
      tenantSlug={tenant}
      unlockedTemplateIds={unlockedTemplateIds}
    />
  );
}
```

Edit `apps/web/components/invitations/invitation-editor.tsx` — extend `Props` (around line 50, next to the existing `tenantSlug: string;`):

```tsx
  tenantSlug: string;
  unlockedTemplateIds: string[];
```

Update the function signature (around line 53):

```tsx
export function InvitationEditor({ invitation, tenantSlug, unlockedTemplateIds }: Props) {
```

Update the `<EditorTheme />` call (around line 268) to pass the two new props it now requires:

```tsx
            {activeTab === "theme" && (
              <EditorTheme
                theme={theme}
                templateId={templateId}
                onThemeChange={updateTheme}
                onTemplateChange={updateTemplate}
                tenantId={invitation.tenantId}
                tenantSlug={tenantSlug}
                unlockedTemplateIds={unlockedTemplateIds}
              />
            )}
```

- [ ] **Step 5: Manual verification**

Open the new-invitation page: confirm free templates (Minimalist Modern, Islamic Elegant) select immediately, premium ones show the 🔒 Rp 15.000 badge and trigger the unlock call on click (with a test tenant that has sufficient balance from earlier tasks) — after unlock, the badge disappears and the template becomes selected. Repeat inside the invitation editor's theme panel.

- [ ] **Step 6: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/\[tenant\]/dashboard/invitations/new/page.tsx \
  apps/web/components/invitations/new-invitation-form.tsx \
  apps/web/components/invitations/editor-sections/editor-theme.tsx
git commit -m "feat(editor): gate premium templates with unlock UI"
```

---

## Task 11: Admin panel UI — layout + 4 pages

**Files:**
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/app/admin/topup-requests/page.tsx`
- Create: `apps/web/app/admin/users/page.tsx`
- Create: `apps/web/app/admin/transactions/page.tsx`
- Create: `apps/web/components/admin/nav.tsx`
- Create: `apps/web/components/admin/topup-queue.tsx`
- Create: `apps/web/components/admin/user-table.tsx`

**Interfaces:**
- Consumes: `getServerSession` from `@/lib/session`, all `/api/v1/admin/*` routes from Tasks 7-8

- [ ] **Step 1: Admin layout with server-side role gate**

Create `apps/web/app/admin/layout.tsx`:

```tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/nav";

const ADMIN_ROLES = new Set(["superadmin", "admin"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) redirect("/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminNav role={role} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Admin nav component**

Create `apps/web/components/admin/nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/topup-requests", label: "Top-Up" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/transactions", label: "Transaksi" },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r bg-card p-4 space-y-1">
      <div className="mb-4">
        <p className="font-serif text-lg font-bold">Admin Panel</p>
        <p className="text-xs text-muted-foreground capitalize">{role}</p>
      </div>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === link.href
              ? "bg-primary/10 font-medium text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Overview page**

Create `apps/web/app/admin/page.tsx`. This is a server component — it calls
the DB helpers directly with normal top-level imports, the same way every
other server-component page in this codebase does (e.g. `[tenant]/dashboard/billing/page.tsx`
from Task 9), rather than hitting our own `/api/v1/admin/overview` HTTP
route and taking a pointless self-fetch round trip:

```tsx
import { aiGenerations, creditTransactions, tenants, topupRequests, withAdminDb } from "@invyte/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

async function fetchOverview() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [revenueRow] = await withAdminDb((tx) =>
    tx
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(creditTransactions)
      .where(and(eq(creditTransactions.type, "topup"), gte(creditTransactions.createdAt, startOfMonth))),
  );
  const [activeTenantsRow] = await withAdminDb((tx) =>
    tx.select({ count: sql<string>`COUNT(*)` }).from(tenants).where(isNull(tenants.deletedAt)),
  );
  const [pendingTopupsRow] = await withAdminDb((tx) =>
    tx.select({ count: sql<string>`COUNT(*)` }).from(topupRequests).where(eq(topupRequests.status, "pending")),
  );
  const [aiGenerationsRow] = await withAdminDb((tx) =>
    tx
      .select({ count: sql<string>`COUNT(*)` })
      .from(aiGenerations)
      .where(and(gte(aiGenerations.createdAt, startOfMonth), eq(aiGenerations.status, "done"))),
  );

  return {
    revenueThisMonth: Number(revenueRow?.total ?? 0),
    activeTenants: Number(activeTenantsRow?.count ?? 0),
    pendingTopupRequests: Number(pendingTopupsRow?.count ?? 0),
    aiGenerationsThisMonth: Number(aiGenerationsRow?.count ?? 0),
  };
}

export default async function AdminOverviewPage() {
  const data = await fetchOverview();

  const cards = [
    { label: "Revenue Bulan Ini", value: `Rp ${data.revenueThisMonth.toLocaleString("id-ID")}` },
    { label: "Tenant Aktif", value: data.activeTenants.toString() },
    { label: "Top-Up Pending", value: data.pendingTopupRequests.toString() },
    { label: "AI Generation Bulan Ini", value: data.aiGenerationsThisMonth.toString() },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: this duplicates the query logic from `/api/v1/admin/overview/route.ts` rather than fetching it over HTTP — acceptable duplication for a server component (no client-side fetch needed, avoids an extra round trip), but if this bothers a future reviewer, both call sites could be collapsed into one `apps/web/lib/admin-metrics.ts` helper — not doing that split now since it's exactly two call sites and YAGNI applies. This page needs no `requireAdminSession` call and no auth-related imports of its own — the parent `admin/layout.tsx` (Step 1) already redirects non-admins before this page renders.

- [ ] **Step 4: Top-up queue component and page**

Create `apps/web/components/admin/topup-queue.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface TopupRequestRow {
  request: {
    id: string;
    packageAmount: number;
    proofImageUrl: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
  };
  tenantName: string;
  tenantSlug: string;
  userEmail: string;
}

export function TopupQueue({ canApprove }: { canApprove: boolean }) {
  const [rows, setRows] = useState<TopupRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/topup-requests?status=pending");
    const data = (await res.json()) as { topupRequests: TopupRequestRow[] };
    setRows(data.topupRequests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    setActioningId(id);
    await fetch(`/api/v1/admin/topup-requests/${id}/approve`, { method: "POST" });
    await load();
    setActioningId(null);
  }

  async function reject(id: string) {
    const reason = window.prompt("Alasan penolakan:");
    if (!reason) return;
    setActioningId(id);
    await fetch(`/api/v1/admin/topup-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Tidak ada request pending.</p>;

  return (
    <div className="space-y-3">
      {rows.map(({ request, tenantName, tenantSlug, userEmail }) => (
        <div key={request.id} className="rounded-xl border bg-card p-4 flex items-start gap-4">
          <img
            src={request.proofImageUrl}
            alt="Bukti transfer"
            className="h-20 w-20 rounded-lg object-cover border shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {tenantName} <span className="text-muted-foreground">({tenantSlug})</span>
            </p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
            <p className="text-sm mt-1">Rp {request.packageAmount.toLocaleString("id-ID")}</p>
          </div>
          {canApprove && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void approve(request.id)}
                disabled={actioningId === request.id}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void reject(request.id)}
                disabled={actioningId === request.id}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

Create `apps/web/app/admin/topup-requests/page.tsx`:

```tsx
import { TopupQueue } from "@/components/admin/topup-queue";
import { getServerSession } from "@/lib/session";

export default async function AdminTopupRequestsPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Top-Up Requests</h1>
      <TopupQueue canApprove={role === "superadmin"} />
    </div>
  );
}
```

- [ ] **Step 5: User table component and page**

Create `apps/web/components/admin/user-table.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  tenants: { tenantName: string; tenantSlug: string; role: string }[];
}

export function UserTable({ canModerate }: { canModerate: boolean }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/users");
    const data = (await res.json()) as { users: UserRow[] };
    setRows(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleBan(id: string, banned: boolean) {
    setActioningId(id);
    await fetch(`/api/v1/admin/users/${id}/${banned ? "unban" : "ban"}`, { method: "POST" });
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Nama</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Tenant</th>
            <th className="px-4 py-2 font-medium">Status</th>
            {canModerate && <th className="px-4 py-2 font-medium">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {u.tenants.map((t) => t.tenantSlug).join(", ") || "—"}
              </td>
              <td className="px-4 py-2">
                {u.banned ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Banned</span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Aktif</span>
                )}
              </td>
              {canModerate && (
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => void toggleBan(u.id, u.banned)}
                    disabled={actioningId === u.id}
                    className="rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-60"
                  >
                    {u.banned ? "Unban" : "Ban"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Create `apps/web/app/admin/users/page.tsx`:

```tsx
import { UserTable } from "@/components/admin/user-table";
import { getServerSession } from "@/lib/session";

export default async function AdminUsersPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <UserTable canModerate={role === "superadmin"} />
    </div>
  );
}
```

- [ ] **Step 6: Transactions page**

Create `apps/web/app/admin/transactions/page.tsx`:

```tsx
import { withAdminDb, creditTransactions, tenants } from "@invyte/db";
import { desc, eq } from "drizzle-orm";

async function fetchTransactions() {
  return withAdminDb((tx) =>
    tx
      .select({ transaction: creditTransactions, tenantName: tenants.name, tenantSlug: tenants.slug })
      .from(creditTransactions)
      .innerJoin(tenants, eq(creditTransactions.tenantId, tenants.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(100),
  );
}

const TYPE_LABELS: Record<string, string> = {
  topup: "Top-Up",
  debit_ai_generation: "AI Generation",
  debit_template_unlock: "Unlock Template",
};

export default async function AdminTransactionsPage() {
  const rows = await fetchTransactions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Tipe</th>
              <th className="px-4 py-2 font-medium text-right">Jumlah</th>
              <th className="px-4 py-2 font-medium text-right">Saldo Setelah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ transaction, tenantName, tenantSlug }) => (
              <tr key={transaction.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2">
                  {tenantName} <span className="text-muted-foreground">({tenantSlug})</span>
                </td>
                <td className="px-4 py-2">{TYPE_LABELS[transaction.type] ?? transaction.type}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${transaction.amount < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {transaction.balanceAfter.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Manual verification**

Log in as the seeded `superadmin`. Visit `/admin` → 4 metric cards render with real numbers. Visit `/admin/topup-requests` → pending queue shows the request(s) from Task 9's manual test, Approve/Reject buttons work end to end. Visit `/admin/users` → table shows all users with their tenants, Ban/Unban works (confirm a banned user can no longer log in — better-auth's plugin enforces this automatically on session creation). Visit `/admin/transactions` → ledger table shows every transaction created across all previous tasks' manual tests. Log in as a test `admin` (non-super) user — confirm all 4 pages still render (read access) but Approve/Reject/Ban buttons are absent.

- [ ] **Step 8: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/admin apps/web/components/admin
git commit -m "feat(admin): add admin panel — overview, topup queue, users, transactions"
```

---

## Task 12: Bootstrap superadmin + full-stack verification pass

**Files:**
- No files — this task is a DB command plus verification, not new code.

- [ ] **Step 1: Promote Kelvin's real account to `superadmin`**

The account already exists (created via real signup ahead of this plan's
execution, not seed data). Once Task 1's migration has added the `role`
column, run directly against the dev database (with `.env` exported):

```bash
psql "$DATABASE_URL" -c "UPDATE \"user\" SET role = 'superadmin' WHERE email = 'kelvinprasetya2701@gmail.com';"
```

Do **not** promote the `seed.ts` admin (`admin@undangan.local`) — that
account is test/seed data, not the operator account. Leave `seed.ts`
unmodified in this task.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm --filter @invyte/db test`
Expected: all 4 credit ledger tests pass (from Task 2).

- [ ] **Step 3: Full typecheck across the monorepo**

Run: `pnpm typecheck` (root script, runs `turbo typecheck` across all packages)
Expected: zero errors in `@invyte/db`, `@invyte/web`, `@invyte/templates`.

- [ ] **Step 4: Biome check**

Run:
```bash
npx biome check apps/web/app/admin apps/web/components/admin apps/web/components/billing \
  apps/web/components/invitations apps/web/components/dashboard \
  apps/web/app/api/v1/admin apps/web/app/api/v1/tenant apps/web/app/api/v1/invitations \
  apps/web/lib packages/db/src packages/templates/src/index.ts
```
Expected: 0 errors (warnings pre-existing elsewhere in the repo are fine, per this project's established Biome baseline — do not attempt to fix unrelated pre-existing warnings). Fix any errors with `npx biome check --write <path>` for pure formatting issues; hand-fix anything else.

- [ ] **Step 5: End-to-end manual walkthrough**

With `docker-compose.dev.yml` running and dev server up (`PORT=3001 pnpm dev --filter @invyte/web`):

1. Register a fresh test account, confirm `credit_balance` starts at 0.
2. Attempt AI generation → 402.
3. As `superadmin`, in `/admin/users`, note the test tenant doesn't have a top-up yet.
4. As the test user, submit a top-up request via `/[tenant]/dashboard/billing` with a real image file.
5. As `superadmin`, approve it in `/admin/topup-requests` → confirm balance updates in the header widget on next page load for the test user.
6. Retry AI generation → succeeds, balance drops by Rp 5.000.
7. Try creating an invitation with a premium template → 402 in the form, unlock it via the picker (with sufficient balance) → succeeds.
8. Check `/admin/transactions` → all of the above appear in order with correct running `balanceAfter`.
9. Ban the test user from `/admin/users`, confirm they're logged out / can't log back in.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/seed.ts
git commit -m "feat(db): promote seed admin to superadmin role"
```

---

## Final Report

After Task 12 completes, summarize for the user: what was built (list the 4 subsystems from the spec), confirm all typechecks/tests/biome are green, list the two things intentionally deferred (Midtrans/Xendit integration, WhatsApp ordering — both per the spec's Non-goals), and remind them the payment-info placeholder text in `topup-form.tsx` still needs their real bank/QRIS details before this goes live for real customers.
