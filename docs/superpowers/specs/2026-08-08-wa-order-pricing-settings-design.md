# Pricing Settings & WhatsApp Order Intake — Design

**Date:** 2026-08-08
**Status:** Approved for planning
**Author:** Kelvin Prasetya (via Claude Code brainstorming session)

## Context

Follow-up to `2026-08-08-credit-system-admin-dashboard-design.md`, which
deliberately deferred a WhatsApp-based "done-for-you" ordering flow: a
customer sends their wedding data via WA chat, pays a set price, and an
`admin`-role staff member builds the invitation on their behalf. That spec
already established the `superadmin`/`admin` role split this feature uses.

This spec also folds in a prerequisite the order feature exposed: pricing
values (AI generation cost, template unlock cost, top-up package amounts)
are currently hardcoded module constants in `apps/web/lib/pricing.ts`. The
order feature needs its own price to be adjustable without a code deploy, so
this spec makes **all** pricing values superadmin-editable through one
settings page rather than adding a one-off mechanism for just the order
price.

## Goals

1. A `/admin/settings` page where `superadmin` can view and edit every price
   in the system (AI generation cost, template unlock cost, order package
   price, the 3 top-up package amounts). `admin` gets read-only access,
   consistent with every other admin page.
2. Staff (`admin` or `superadmin`) can record a WhatsApp-originated order:
   customer name/contact, at the current order price (snapshotted, not a
   live reference to settings). Recording an order creates a dedicated
   tenant, adds the staff member to it, and hands off into the **existing**
   invitation-creation flow — no new editor UI.
3. Order payment is confirmed the same way top-ups are (proof upload,
   `superadmin` approves) but through its own table and its own admin queue
   — visually and structurally distinct from `topup_requests`, so the two
   never get confused in the UI.
4. The admin overview's "Revenue This Month" metric includes paid orders,
   not just credit top-ups — otherwise order revenue is invisible in
   reporting despite being tracked.
5. Staff-created tenants are tagged distinctly from self-serve signups, so
   future analytics (and today's "active tenants" overview metric) can tell
   the two apart.

## Non-goals

- No WhatsApp bot, webhook message parsing, or Cloud API message-content
  integration — intake is 100% manual (staff reads WA in a normal client,
  types the order into the dashboard). No Baileys, no Meta app setup.
- No mechanism to revoke a staff member's tenant access after an order is
  handed to the customer — staff stays a member indefinitely. Revisit later
  if it becomes a real problem, not before.
- No change to how many top-up packages exist (still exactly 3) — only
  their amounts become editable.
- Giving the customer their own login is **not new work**: this app already
  has `POST /api/v1/tenant/members` (add a member to a tenant by email).
  Once a customer wants access, staff uses that existing flow on the
  order's tenant. Nothing in this spec needs to build that.

## Data Model

New Drizzle migration adding:

### `platform_settings` (new)
Key-value settings table, one row per price.
- `key` text primary key: `ai_generation_cost`, `template_unlock_cost`,
  `order_package_price`, `topup_package_1`, `topup_package_2`,
  `topup_package_3`
- `value` integer not null — Rupiah, no decimals, matching every other money
  field in this codebase
- `updatedBy` → `user.id` nullable
- `updatedAt` timestamptz default now
- Seeded via migration data (or a one-time seed step) with the current
  hardcoded values (5,000 / 15,000 / 150,000 / 25,000 / 100,000 / 500,000)
  so behavior is unchanged until a superadmin actually edits something.

### `orders` (new)
- `id` text PK (uuidv7, via `apps/web/lib/uuid.ts` — this table lives in
  `apps/web`'s domain, not `packages/db`, so the existing app-level helper
  applies here, unlike `credit_transactions` which needed its own copy)
- `customerName` text not null
- `customerContact` text not null (phone/WA number, free text)
- `notes` text nullable (whatever staff wants to jot down from the chat)
- `price` integer not null — **snapshotted** from `platform_settings` at
  creation time, never re-read live
- `createdBy` → `user.id` not null (the staff member who logged the order)
- `tenantId` → `tenants.id` **not null** — order creation always creates the
  tenant in the same transaction as the order row (see Backend Flows), so
  there is never a valid state where an order exists without one
- `invitationId` → `invitations.id` nullable, `ON DELETE SET NULL` (set once
  staff actually creates the invitation inside the new tenant — this spec
  doesn't require it to happen atomically with order creation, staff may
  create the order, then build the invitation in a separate action)
- `paymentStatus` enum: `pending`, `paid`, `rejected`, default `pending`
- `proofImageUrl` text nullable (set when staff/customer uploads transfer
  proof — reuses the existing `/api/v1/media/upload` endpoint, same as
  top-up requests)
- `reviewedBy` → `user.id` nullable
- `reviewedAt` timestamptz nullable
- `rejectionReason` text nullable
- `createdAt` timestamptz default now
- index on `(paymentStatus, createdAt)` for the admin queue

### `tenants` (no schema change — reuse existing `settings` jsonb)
Staff-created tenants get `settings: { source: "staff_order" }` set at
creation. This matches the existing idiom already used elsewhere on this
same column (e.g. `invitations.settings.guestOnly`) rather than adding a
dedicated boolean column for one flag.

## Roles & Access

- `/admin/settings` — same pattern as every other `/admin/*` page: visible
  to `admin` + `superadmin`, mutating (`PATCH`) is `superadmin`-only via
  `requireAdminSession(req, { write: true })`.
- `/admin/orders` — visible and **writable** (create order) by **both**
  `admin` and `superadmin`. This is the one place in the admin surface where
  `admin` gets write access — recording orders is `admin`'s actual job per
  the original role design ("admin: bisa buatkan undangan"), not a
  financial action. Approving an order's *payment* is still
  `superadmin`-only (`POST /admin/orders/[id]/approve`), matching the
  top-up approval tier exactly.

## Backend Flows

### Settings read/write

`apps/web/lib/settings.ts` — `getPricingSettings(): Promise<PricingSettings>`
reads all 6 rows from `platform_settings`, returns a typed object
(`{ aiGenerationCost, templateUnlockCost, orderPackagePrice,
topupPackages: [n, n, n] }`). No caching layer — this app has no existing
caching precedent for anything else in this feature (tenant lookups,
credit balances are all read fresh per request), so a settings read per
request stays consistent with that, and traffic is low enough (per this
project's own stated targets: 500+ concurrent viewers, 50+ concurrent
editors) that this is not a premature-optimization risk.

`apps/web/lib/pricing.ts`'s module constants (`AI_GENERATION_COST_RUPIAH`,
`TEMPLATE_UNLOCK_COST_RUPIAH`, `TOPUP_PACKAGES_RUPIAH`) are removed. Every
call site that imported them switches to calling `getPricingSettings()` and
reading the relevant field — this touches the AI generation route, the
template unlock route, the top-up submission route (validates
`packageAmount` against the live 3 values instead of a hardcoded array),
the top-up form UI (needs the 3 package amounts server-side, threaded down
as a prop the same way `creditBalance` already is), and the template-picker
lock badges (need `templateUnlockCost` to display the price — same
prop-threading pattern already established for `unlockedTemplateIds`).

`PATCH /api/v1/admin/settings` (`requireAdminSession({write:true})`) —
body is a partial map of key→value, validates each value is a positive
integer, updates the matching rows, sets `updatedBy`/`updatedAt`.

### Order creation

`POST /api/v1/admin/orders` — gated by `requireAdminSession(req)` (the
default read tier, which already means "role is `admin` or `superadmin`").
No `{ write: true }` needed here — per the Roles section above, order
creation is intentionally allowed at the `admin` tier, unlike every other
mutating `/api/v1/admin/*` route in this codebase so far. Body:
`{ customerName, customerContact, notes? }`.

In one transaction:
1. Read current `order_package_price` from `platform_settings`.
2. Create a new tenant (`type: "personal"`, `name` derived from
   `customerName`, `slug` auto-generated the same way the existing
   `POST /api/v1/tenant` route already does, `settings: { source:
   "staff_order" }`, default `limits` matching what personal tenants
   already get elsewhere in this codebase).
3. Add the creating staff member (`memberships`, `role: "owner"`) to that
   tenant.
4. Insert the `orders` row: `price` = the value read in step 1,
   `tenantId` = the new tenant's id, `createdBy` = the staff user id.

Returns `{ order, tenantSlug }` — the admin UI redirects staff straight into
`/${tenantSlug}/dashboard/invitations/new` (the existing, unmodified
new-invitation flow) so they can build the invitation immediately.

### Order payment — submit & approve

Mirrors the top-up flow's already-fixed atomicity pattern from the start
(no separate "find the bug, then fix it" cycle needed this time — apply the
lesson immediately):

- `POST /api/v1/admin/orders/[id]/proof` (`requireAdminSession()`) — sets
  `proofImageUrl` on the order (staff uploads on the customer's behalf,
  since the customer has no login yet in the common case).
- `POST /api/v1/admin/orders/[id]/approve` (`requireAdminSession({write:
  true})`) — single transaction: row-locked re-read of the `orders` row,
  verify `paymentStatus === "pending"`, update to `paid` +
  `reviewedBy`/`reviewedAt`. No credit-ledger interaction — this is a
  one-off service fee, not a top-up, so it does not touch
  `tenants.credit_balance` or `credit_transactions` at all.
- `POST /api/v1/admin/orders/[id]/reject` — same shape as the top-up
  reject route (row-locked, one transaction, `rejectionReason` required).

### Revenue metric fix

`apps/web/app/admin/page.tsx`'s `fetchOverview()` (and the matching
`/api/v1/admin/overview` route) changes "Revenue This Month" from summing
only `credit_transactions` where `type = "topup"` to summing that **plus**
`orders.price` where `paymentStatus = "paid"` and `reviewedAt` falls in the
current month. Two separate queries summed in application code (not a SQL
UNION) — simplest given the two tables have unrelated schemas.

## Frontend

### `/admin/settings` (new page)

Simple form: 6 labeled number inputs (AI generation cost, template unlock
cost, order package price, top-up package 1/2/3), current values
pre-filled, one "Simpan" button, `superadmin`-only submit (disabled/hidden
for `admin`, matching the existing pattern from top-up-queue/user-table).

### `/admin/orders` (new page)

Two sections:
- "Buat Order Baru" — form (customer name, contact, notes) + submit →
  redirects to the new tenant's invitation-creation flow on success.
- Queue of existing orders — table/list showing customer, price, payment
  status, with an upload-proof action (if no proof yet) and
  approve/reject buttons (`superadmin`-only, same visibility pattern as
  `topup-queue.tsx`).

### Admin nav

`apps/web/components/admin/nav.tsx` gets two new entries: "Settings" and
"Orders", alongside the existing Overview/Top-Up/Users/Transactions.

## Testing

- No net-new automated-test requirement beyond what this codebase already
  established: the settings/order approval routes follow the exact
  atomicity pattern already covered by `packages/db/src/credit.test.ts`'s
  concurrency test (same row-lock technique, no ledger interaction to
  duplicate-test since orders don't touch `credit_transactions`).
- Manual verification checklist (documented in the implementation plan):
  create an order, confirm tenant+membership+invitation-flow handoff works,
  submit proof, approve as superadmin, confirm revenue metric includes it,
  confirm `admin` role can create orders but not approve them, confirm
  editing a setting doesn't change already-recorded order prices.

## Open Items Deferred to Implementation Plan

- Exact migration file contents (generated from schema changes)
- Exact tenant `slug`/`limits` defaults for staff-created tenants (must
  match whatever the existing `POST /api/v1/tenant` route already uses —
  read that route during planning, don't invent new defaults)
