# Credit System, Premium Templates & Admin Dashboard — Design

**Date:** 2026-08-08
**Status:** Approved for planning
**Author:** Kelvin Prasetya (via Claude Code brainstorming session)

## Context

UcapinStudio (fork of Invyte) is repositioning from "free/self-hosted" to a paid
service (see `rebranding.md`). This spec covers the first paid-feature
sub-project: a manual-confirmation credit system, premium template gating, and
the admin tooling needed to run it. It deliberately deviates from two points in
`todo.md`'s prior monetization roadmap (MON-1), with the fork owner's explicit
sign-off:

- MON-1 assumed automated Midtrans/Xendit integration for top-ups. This spec
  uses **manual confirmation** instead (user submits proof of transfer, an
  admin approves) — no payment gateway API integration in this phase.
- The `todo.md` skip list deferred "premium template pack" pending a "designer
  pipeline" (i.e., new template designs). This spec instead **paywalls a
  subset of the 7 existing templates** — no new template design work involved,
  so the original blocker doesn't apply.

**Out of scope for this spec** (flagged during brainstorming, to be
brainstormed separately later): a WhatsApp-based "done-for-you" ordering flow,
where a customer sends their wedding data via WA chat, pays a set price, and
an `admin`-role staff member builds the invitation on their behalf. That
subsystem depends on decisions not yet made (how WA intake works, order
pricing, invitation ownership) and is intentionally deferred to its own
spec. This spec only establishes the `superadmin` / `admin` / `user` role
foundation that subsystem will build on.

## Goals

1. Tenants have a Rupiah credit balance. AI generation and premium template
   unlocks debit it.
2. Users top up via a manual flow: pick a package, see static payment info
   (QRIS/bank, placeholder for now), upload proof of transfer, wait for
   approval.
3. Two platform-wide roles beyond regular users: `superadmin` (full
   management) and `admin` (read access to admin panel, no mutating actions;
   reserved for the future WA-order staff role — this spec only creates the
   role and its read-only gate, it grants no invitation-creation capability
   yet).
4. An `/admin` panel: overview metrics, top-up approval queue, user/tenant
   list with ban capability, transaction ledger.

## Non-goals

- Payment gateway integration (Midtrans/Xendit) — explicit non-goal per
  existing project docs; may be revisited later, but this spec's manual flow
  supersedes it for now.
- WhatsApp ordering / staff-built invitations — separate future spec.
- New template designs — only gating the 7 that already exist.
- Per-action granular permissions beyond the two-role split defined here.

## Data Model

New Drizzle migration adding:

### `tenants` (alter)
- `credit_balance` — `integer` not null default `0`. Rupiah, no decimals.
  Denormalized cache; `credit_transactions` is the source of truth and every
  write to `credit_balance` happens in the same DB transaction as the ledger
  insert that justifies it.

### `credit_transactions` (new)
Append-only ledger.
- `id` text PK (uuid v7, matches project convention)
- `tenant_id` → `tenants.id`
- `type` enum: `topup`, `debit_ai_generation`, `debit_template_unlock`
- `amount` integer (positive for `topup`, negative for debits)
- `balance_after` integer — snapshot for audit, avoids recomputation
- `reference_type` text nullable (`'topup_request' | 'ai_generation' | 'template_unlock'`)
- `reference_id` text nullable
- `description` text nullable
- `created_at` timestamptz default now
- index on `(tenant_id, created_at desc)`

### `topup_requests` (new)
- `id` text PK
- `tenant_id` → `tenants.id`
- `user_id` → `user.id` (who submitted)
- `package_amount` integer — one of the configured package sizes
- `proof_image_url` text — from existing media upload endpoint
- `status` enum: `pending`, `approved`, `rejected`, default `pending`
- `reviewed_by` → `user.id` nullable
- `reviewed_at` timestamptz nullable
- `rejection_reason` text nullable
- `created_at` timestamptz default now
- index on `(status, created_at)` for the admin queue

### `template_unlocks` (new)
- `id` text PK
- `tenant_id` → `tenants.id`
- `template_id` text (matches `TemplateMeta.id`, e.g. `"floral-classic"`)
- `unlocked_at` timestamptz default now
- unique index on `(tenant_id, template_id)`

### `user` (alter — better-auth admin plugin schema)
- `role` text not null default `'user'`
- `banned` boolean not null default `false`
- `ban_reason` text nullable
- `ban_expires` timestamptz nullable

### `session` (alter — better-auth admin plugin schema)
- `impersonated_by` text nullable (plugin requires the column; this spec does
  not build an impersonation UI, just satisfies the schema)

## Roles & Access Control

Enable better-auth's official `admin` plugin (`better-auth/plugins`) in
`apps/web/lib/auth.ts` — reuses its `banUser`/`unbanUser`/`listUsers` server
functions instead of hand-rolling ban logic. `adminRoles` configured as
`["superadmin", "admin"]` so the plugin's own session/ban enforcement
recognizes both, but **our own route code is what decides which actions each
role can perform** (the plugin doesn't natively model our read/write split).

A small shared helper, `apps/web/lib/require-admin.ts`:

```ts
async function requireAdminSession(req, { write = false } = {}) {
  const session = await auth.api.getSession({ headers: req.headers });
  const role = session?.user?.role;
  if (role !== "superadmin" && role !== "admin") return { error: 403 };
  if (write && role !== "superadmin") return { error: 403 };
  return { session };
}
```

Every `/api/v1/admin/*` route calls this first. Mutating routes (approve/reject
top-up, ban/unban/delete user) pass `{ write: true }`.

`middleware.ts` already reserves the `admin` slug (was reserved from day one,
never wired up). Add a branch: any `/admin` path requires a valid session
cookie (redirect to `/auth/login` otherwise), same pattern as the existing
tenant-dashboard check. The middleware check is the first gate (fast, no DB
hit); `requireAdminSession` in each route/page is the real enforcement
(defense-in-depth, matching this project's existing app-level + RLS pattern
elsewhere) — a valid session cookie alone doesn't imply the role.

Bootstrapping the first `superadmin`: one-time manual `UPDATE "user" SET
role = 'superadmin' WHERE email = '...'`. No self-service promotion UI in this
spec.

## Pricing

New constants file `apps/web/lib/pricing.ts` (plain module constants, not env
vars — these are business values that change by editing code and
redeploying, not per-environment config):

```ts
export const AI_GENERATION_COST_RUPIAH = 5_000;
export const TEMPLATE_UNLOCK_COST_RUPIAH = 15_000;
export const TOPUP_PACKAGES_RUPIAH = [25_000, 100_000, 500_000] as const;
```

### Premium templates

`packages/templates/src/index.ts`: add `isPremium: boolean` to `TemplateMeta`.

| Template | Free? |
|---|---|
| minimalist-modern | ✅ free |
| islamic-elegant | ✅ free |
| floral-classic | premium |
| tropical-bali | premium |
| royal-java | premium |
| serene-garden | premium |
| ai-composer | premium |

Unlock is **per-tenant, one-time** (not debited again on reuse) — tracked in
`template_unlocks`.

## Backend Flows

### Credit ledger helper

`packages/db/src/credit.ts` (or similar) — `debitCredit(tenantId, amount, type, referenceId?, description?)`:
wraps a Drizzle transaction that re-reads `tenants.credit_balance` with a row
lock, rejects if `balance < amount`, inserts the `credit_transactions` row
with the resulting `balance_after`, updates `tenants.credit_balance`. Throws a
typed `InsufficientCreditError` the callers turn into a 402-style JSON error.
A parallel `creditTopup(tenantId, amount, referenceId)` for the approval path
(no balance check, only adds).

### AI generation route (`.../ai/generate/route.ts`)

Before invoking the provider: check `tenant.creditBalance >=
AI_GENERATION_COST_RUPIAH`, return a clear "saldo tidak cukup" error if not.
On successful generation, `debitCredit(..., "debit_ai_generation", generationId)`.

### Template unlock — `POST /api/v1/tenant/templates/[templateId]/unlock`

Looks up template in `TEMPLATES`, 404 if unknown, no-op success if already
free or already unlocked, otherwise `debitCredit(..., "debit_template_unlock", templateId)`
+ insert `template_unlocks` row in the same transaction.

### Template selection enforcement

Both `new-invitation-form.tsx` and `editor-theme.tsx` already read `TEMPLATES`
client-side — add a lock badge + price for premium templates the tenant
hasn't unlocked, clicking prompts unlock (inline if balance suffices, else
routes to top-up). **Server-side**, the invitation create/update route
(`app/api/v1/invitations/route.ts` and the `[id]` route) must also verify: if
`templateId` is premium, tenant must have a matching `template_unlocks` row —
reject otherwise. Client-side gating alone is not suffient (same
defense-in-depth principle as elsewhere in this codebase).

### Top-up request — `POST /api/v1/tenant/topup-requests`

Body: `{ packageAmount, proofImageUrl }` (image already uploaded via the
existing `/api/v1/media/upload` endpoint). Validates `packageAmount` is one of
`TOPUP_PACKAGES_RUPIAH`. Inserts a `pending` row.

### Admin routes (all under `requireAdminSession`)

- `GET /api/v1/admin/topup-requests` (read) — list, filterable by status
- `POST /api/v1/admin/topup-requests/[id]/approve` (write) — status→approved,
  `creditTopup(...)`, sets `reviewedBy`/`reviewedAt`
- `POST /api/v1/admin/topup-requests/[id]/reject` (write) — status→rejected +
  `rejectionReason`
- `GET /api/v1/admin/users` (read) — list users joined to their tenants/memberships
- `POST /api/v1/admin/users/[id]/ban` / `/unban` (write) — wraps better-auth
  admin plugin functions
- `GET /api/v1/admin/transactions` (read) — paginated `credit_transactions`
  joined to tenant name, filterable by type
- `GET /api/v1/admin/overview` (read) — aggregate counts for the metric cards

## Frontend

### Tenant-facing (inside existing `[tenant]/dashboard`)

- Credit balance widget in the dashboard header (small, next to existing
  workspace-name display)
- New page `[tenant]/dashboard/billing` (or similar): package picker → static
  placeholder QRIS/bank info (`"[ISI NOMOR REKENING DI SINI]"` etc., swapped
  in later by Kelvin) → proof upload (reuses existing media upload UI
  pattern) → submit → shows request status (pending/approved/rejected)

### Admin panel (new top-level `app/admin/*`, outside the `[tenant]` segment)

- `app/admin/layout.tsx` — nav (Overview / Top-up / Users / Transactions),
  server-side role check (redirect non-admins), visually distinct from the
  tenant dashboard chrome
- `app/admin/page.tsx` — metric cards: this-month revenue (sum of `topup`
  transactions), active tenant count, pending top-up count, this-month AI
  generation count
- `app/admin/topup-requests/page.tsx` — queue, proof image preview,
  approve/reject buttons (disabled/hidden for `admin` role, active for
  `superadmin`)
- `app/admin/users/page.tsx` — table of users + tenants, ban/unban button
  (superadmin only)
- `app/admin/transactions/page.tsx` — paginated ledger table with type filter

All four pages render for both `admin` and `superadmin`; mutating controls
check role client-side for UX (hide/disable) but the real enforcement is
server-side in the route handlers, per the access-control section above.

## Testing

- Unit test for `debitCredit`/`creditTopup`: insufficient balance rejected,
  concurrent debits don't race past zero (transaction + row lock), ledger row
  matches balance delta. This is the money-handling path — it gets a real
  test, not just manual poking.
- Manual verification checklist for the approval flow and template gate
  (documented in the implementation plan, not automated in this phase).

## Open Items Deferred to Implementation Plan

- Exact drizzle-kit migration file contents (generated from schema changes)
- Whether `app/admin` needs its own root layout wrapper or reuses parts of
  the existing dashboard shell components
- Placeholder copy for the payment-info screen
