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

**The end-to-end flow, confirmed during brainstorming:** staff logs an order
from an initial WA conversation (name + contact only) → staff sends the
customer a unique link → customer opens that link (no account, no login —
public, scoped to their order only) and fills in their own wedding data
(names, event details, photos, story) and uploads payment proof, all on one
page → `superadmin` approves the payment → staff opens the order in the
admin panel and creates the invitation pre-filled with what the customer
submitted → staff picks a template and polishes in the **existing** invitation
editor → staff publishes and sends the resulting public invitation link
back to the customer over the same WA thread. The customer never needs an
account at any point in this flow — invitation delivery reuses the
already-existing public `/{tenant}/u/{slug}` link every self-serve
invitation already gets. An account only enters the picture later, if the
customer specifically asks to manage the invitation themselves (guest list,
RSVP data) — handled by the already-existing `POST /api/v1/tenant/members`,
not by anything new in this spec.

## Goals

1. A `/admin/settings` page where `superadmin` can view and edit every price
   in the system (AI generation cost, template unlock cost, order package
   price, the 3 top-up package amounts). `admin` gets read-only access,
   consistent with every other admin page.
2. Staff (`admin` or `superadmin`) can record a WhatsApp-originated order:
   customer name/contact, at the current order price (snapshotted, not a
   live reference to settings). Recording an order creates a dedicated
   tenant, adds the staff member to it, and generates a unique public link
   for the customer.
3. A public, unauthenticated page at that unique link lets the customer
   submit their own wedding data (host names, event details, photos, short
   story) and upload payment proof — no account required.
4. Order payment is confirmed the same way top-ups are (proof upload,
   `superadmin` approves) but through its own table and its own admin queue
   — visually and structurally distinct from `topup_requests`, so the two
   never get confused in the UI.
5. Once paid, staff creates the invitation from the order with one action —
   pre-filled from the customer's submission — then finishes it in the
   **existing** invitation editor (template choice, polish). No new editor
   UI.
6. The admin overview's "Revenue This Month" metric includes paid orders,
   not just credit top-ups — otherwise order revenue is invisible in
   reporting despite being tracked.
7. Staff-created tenants are tagged distinctly from self-serve signups, so
   future analytics (and today's "active tenants" overview metric) can tell
   the two apart.

## Non-goals

- No WhatsApp bot, webhook message parsing, or Cloud API message-content
  integration — the only manual step is staff typing the customer's
  name/contact from the initial chat; everything else the customer provides
  themselves through the public order page, not through WA message parsing.
  No Baileys, no Meta app setup.
- No account/login for the customer at any point in this flow (see Context)
  — the public order-intake page and the public invitation link are both
  unauthenticated by design, not a gap to fill later.
- No mechanism to revoke a staff member's tenant access after an order is
  handed to the customer — staff stays a member indefinitely. Revisit later
  if it becomes a real problem, not before.
- No change to how many top-up packages exist (still exactly 3) — only
  their amounts become editable.
- Giving the customer their own login is **not new work** if they ever ask
  for it: this app already has `POST /api/v1/tenant/members` (add a member
  to a tenant by email). Nothing in this spec needs to build that.

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
  staff actually creates the invitation via the "create invitation from
  order" action — see Backend Flows)
- `accessToken` text not null, unique — a high-entropy random string (32+
  bytes, `crypto.randomBytes(32).toString("base64url")` or equivalent — this
  gates access to money and a customer's private wedding data, so it gets
  meaningfully more entropy than the existing 8-char guest-slug nanoids used
  for invitation personalization elsewhere in this codebase, which don't
  guard payment). This is the only credential the public order page checks
  — no login, just "did the request include the right token."
- `submittedData` jsonb nullable — filled when the customer submits the
  public form. Shape is deliberately a subset of
  `@invyte/templates`'s `InvitationContent` (`hosts: HostInfo`,
  `events: EventInfo[]`, `story?: string`, `galleryUrls?: string[]`) so it
  can be copied close to verbatim into a new invitation's `content` field
  with no translation layer — see "Create invitation from order" below.
- `paymentStatus` enum: `pending`, `paid`, `rejected`, default `pending`
- `proofImageUrl` text nullable (set when the customer uploads transfer
  proof through the public order page — reuses the existing
  `/api/v1/media/upload` endpoint, same as top-up requests)
- `reviewedBy` → `user.id` nullable
- `reviewedAt` timestamptz nullable
- `rejectionReason` text nullable
- `createdAt` timestamptz default now
- index on `(paymentStatus, createdAt)` for the admin queue
- unique index on `accessToken` (the public page's only lookup key)

### `orders` and `platform_settings`: no RLS

Both tables deliberately get **no RLS policy**, joining the existing
`user`/`session`/`account`/`verification`/`tenants` "no RLS, app-level check
only" precedent already documented in `packages/db/rls.sql` — not an
oversight. Neither table fits the tenant-scoped mold every other new table
in this feature area got: `orders` is read either cross-tenant by staff
(`withAdminDb`, same as everywhere else in the admin surface) or by an
anonymous customer through a single-row token lookup that has no tenant
context to set at all (`app.tenant_id` would be meaningless for "look up
the one row matching this token"); `platform_settings` has no `tenant_id`
column full stop, it's global by definition. Both are protected entirely by
their route handlers — `requireAdminSession` for the admin routes, the
`accessToken` equality check for the public ones.

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

### Order creation (staff-facing)

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
4. Generate `accessToken` (see Data Model).
5. Insert the `orders` row: `price` = the value read in step 1,
   `tenantId` = the new tenant's id, `createdBy` = the staff user id,
   `accessToken` from step 4.

Returns `{ order }`, including the full public URL
(`${APP_URL}/order/${accessToken}`) the admin UI displays for staff to copy
and paste into the WA conversation with the customer.

### Public order page (customer-facing, no auth)

- `GET /api/v1/orders/[token]` — public, no session check. Looks up the
  order by `accessToken`. Returns only what the public page needs to render
  (`customerName`, `price`, `paymentStatus`, whether `submittedData`/
  `proofImageUrl` are already set) — never returns `customerContact`,
  `notes`, `tenantId`, `createdBy`, or any other internal field. A token
  that doesn't match any row returns 404, indistinguishable from a
  never-issued token (no signal to an attacker about whether a guessed
  token is "close").
- `POST /api/v1/orders/[token]/submit` — public, no session check.
  **Correction from an earlier draft of this spec:** the existing
  `/api/v1/media/upload` endpoint requires an authenticated session
  (`requireSession()` + tenant-membership check) — the anonymous customer
  has neither, so this route cannot reuse it as a separate client-side hop
  the way `topup-form.tsx` does. Instead, this route accepts
  `multipart/form-data` directly (photos + proof-of-transfer file +
  `submittedData` as a JSON-stringified field, in one request) and calls
  `uploadImage()` from `@invyte/storage` itself, server-side — the same
  underlying function `/api/v1/media/upload` calls internally, just invoked
  directly here instead of through that session-gated route. Each uploaded
  file gets a `media` row (scoped to the order's `tenantId`, same shape
  every other media row already gets). Validates `submittedData` (parsed
  from the JSON field) against a zod schema matching the `HostInfo`/
  `EventInfo` subset (Data Model), and validates file types/sizes the same
  way `/api/v1/media/upload` already does (magic-byte sniffing via the
  existing storage adapter — not re-implemented, just called directly).
  Sets `submittedData` (with the resulting upload URLs filled in) and
  `proofImageUrl` on the order in one update. Does **not** change
  `paymentStatus` — that only moves on explicit `superadmin` approval, so a
  customer submitting data can never itself mark an order as paid.

### Order payment — approve & reject (staff-facing)

Mirrors the top-up flow's already-fixed atomicity pattern from the start
(no separate "find the bug, then fix it" cycle needed this time — apply the
lesson immediately):

- `POST /api/v1/admin/orders/[id]/approve` (`requireAdminSession({write:
  true})`) — single transaction: row-locked re-read of the `orders` row,
  verify `paymentStatus === "pending"`, update to `paid` +
  `reviewedBy`/`reviewedAt`. No credit-ledger interaction — this is a
  one-off service fee, not a top-up, so it does not touch
  `tenants.credit_balance` or `credit_transactions` at all.
- `POST /api/v1/admin/orders/[id]/reject` — same shape (row-locked, one
  transaction, `rejectionReason` required).

### Create invitation from order (staff-facing)

`POST /api/v1/admin/orders/[id]/create-invitation` —
`requireAdminSession(req)` (default read tier — same `admin`-can-write
carve-out as order creation, since building the invitation is `admin`'s
job). Requires `paymentStatus === "paid"` (402/409 otherwise) and
`invitationId IS NULL` (409 if already created — this action runs once per
order). Creates an `invitations` row in the order's `tenantId`,
`content` initialized from `orders.submittedData` (host/event/story/gallery
fields copied directly — nothing else in `InvitationContent` is populated,
staff fills the rest via the normal editor), `templateId` defaulted to
`"minimalist-modern"` (staff changes it in the editor same as any other
invitation), `status: "draft"`. Sets `orders.invitationId`. Returns
`{ invitation, tenantSlug }` — the admin UI redirects staff straight into
`/${tenantSlug}/dashboard/invitations/${invitation.id}` (the existing,
unmodified invitation editor) to pick a template and polish.

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
- "Buat Order Baru" — form (customer name, contact, notes) + submit → shows
  the generated public link (`${APP_URL}/order/${accessToken}`) with a
  copy-to-clipboard button, for staff to paste into the WA conversation.
  No redirect — staff's next action happens later, once the customer has
  submitted data and paid.
- Queue of existing orders — table/list showing customer, price, payment
  status, whether data has been submitted yet. Approve/reject buttons
  (`superadmin`-only, same visibility pattern as `topup-queue.tsx`). Once
  `paymentStatus === "paid"` and `invitationId IS NULL`, a "Buat Undangan"
  button appears (visible to `admin` too) that calls the create-invitation
  route and redirects into the existing editor.

### `/order/[token]` (new page, public, no layout auth)

Lives outside both `[tenant]` and `/admin` — a standalone public route
(`apps/web/app/order/[token]/page.tsx`), no session required, no
`middleware.ts` gate (the token itself is the access control, checked
server-side by the page and its one API route). `middleware.ts`'s
`RESERVED_SLUGS` set (which already contains `"admin"` for exactly this
reason) needs `"order"` added too — otherwise a tenant could register the
slug `order` and create ambiguity with this route, even though Next.js's
own static-route-wins-over-dynamic-segment resolution means it wouldn't
actually break anything technically. Shows the order's price and
a form: host names (groom/bride, matching `HostInfo`'s required fields),
at least one event (name/date/time/venue, matching `EventInfo`), a short
story text area, and a multi-photo picker (file inputs collected client-side
— unlike the editor's `editor-story.tsx` gallery uploader, these files are
**not** uploaded one-by-one as they're picked, since there's no session to
authorize each individual `/api/v1/media/upload` call; they're held in
browser state and sent together with the rest of the form). A separate
section below for payment: the same placeholder QRIS/bank-info block
already used on `topup-form.tsx` (identical placeholder text, replaced by
Kelvin later, not duplicated new copy), plus a proof-of-transfer file
picker. One submit button sends everything — form fields plus every
selected file — as a single `multipart/form-data` POST to
`POST /api/v1/orders/[token]/submit` (see Backend Flows for why this
differs from every other upload flow in this codebase). After a successful
submit, the page shows a simple "terkirim, kami akan segera memproses"
confirmation — no further interaction, the customer's part is done until
staff sends them the finished invitation link over WA.

### Delivery — no new UI needed

Two different "delivery" steps, both reusing existing capability with zero
new code:

1. **Confirmation link back to the customer** — once staff publishes the
   invitation, the existing editor already displays its public link
   (`/${tenantSlug}/u/${slug}`) for staff to copy and paste into the WA
   thread.
2. **Broadcast to the couple's own guest list** (can be hundreds of guests
   — not sent one by one) — staff, already a member of the order's tenant,
   uses the **existing** guest CSV bulk-import feature
   (`invitations/[id]/guests/import`) to load the guest list, then the
   **existing** broadcast route (`invitations/[id]/broadcast`) to send every
   guest their personalized link in one action. Both already exist and
   need no changes for this flow.

Broadcast requires a WhatsApp provider credential configured on the
tenant (`messagingCredentials`) — see Operational Notes below for the
decision on whose credential that is.

### Admin nav

`apps/web/components/admin/nav.tsx` gets two new entries: "Settings" and
"Orders", alongside the existing Overview/Top-Up/Users/Transactions.

## Operational Notes (for a future SOP)

Captured here because this decision affects how staff actually run the
process day to day, not just the code — meant to be readable on its own if
Kelvin or an admin needs to re-check "how does this work again" without
digging through the technical sections above.

**WhatsApp guest broadcast — whose credential?** Default: staff broadcasts
using **one shared UcapinStudio-owned** provider account (Fonnte / WA Cloud
API — whichever this deployment already has configured), the same account
for every WA-order tenant. Guests receive a message from UcapinStudio's
business number, but the message content is still fully personalized (guest
name, their own link) — this is standard practice for a broadcast service
and is not a privacy problem on its own. Rationale for defaulting this way:
the whole point of the "dibuatkan" order path is that the customer avoids
technical setup; requiring them to configure their own WA provider would
undermine that.

**Upgrade path, if a specific customer wants their own number:** give that
customer an account (existing `POST /api/v1/tenant/members` flow, already
covered above — no new work), and they configure their own WhatsApp
provider credential themselves via the tenant's existing settings page
(also already exists, no new work). This is a per-customer decision staff
can make case by case — nothing in the system forces one or the other
globally.

**Rough end-to-end staff runbook** (for the eventual SOP document, not
prescriptive code — just the sequence a human follows):
1. Customer messages the UcapinStudio WA number wanting an invitation made.
2. Staff opens `/admin/orders`, creates the order with the customer's name
   and contact, copies the generated link, sends it in the same WA thread.
3. Customer opens the link, fills in their wedding details and photos,
   uploads transfer proof.
4. Superadmin reviews and approves the payment in `/admin/orders`.
5. Staff clicks "Buat Undangan" on the now-paid order, picks a template,
   polishes the pre-filled content in the normal editor, publishes.
6. Staff copies the public invitation link, sends it back over WA.
7. If the customer has (or later sends) a guest list: staff imports it via
   the existing CSV import, then broadcasts via the existing broadcast
   feature — using the shared UcapinStudio WA credential unless this
   specific customer was given their own account and set up their own.

## Testing

- No net-new automated-test requirement beyond what this codebase already
  established: the settings/order approval routes follow the exact
  atomicity pattern already covered by `packages/db/src/credit.test.ts`'s
  concurrency test (same row-lock technique, no ledger interaction to
  duplicate-test since orders don't touch `credit_transactions`).
- Manual verification checklist (documented in the implementation plan):
  create an order, confirm the public order page works with the right
  token and 404s on a wrong/guessed one, confirm `GET /api/v1/orders/[token]`
  never leaks `customerContact`/`notes`/`tenantId`/`createdBy`, submit data
  + proof as the customer, approve as superadmin, create the invitation
  from the order and confirm the submitted data actually lands in the new
  invitation's content, confirm revenue metric includes the paid order,
  confirm `admin` role can create orders and invitations but not approve
  payment, confirm editing a setting doesn't change already-recorded order
  prices.

## Open Items Deferred to Implementation Plan

- Exact migration file contents (generated from schema changes)
- Exact tenant `slug`/`limits` defaults for staff-created tenants (must
  match whatever the existing `POST /api/v1/tenant` route already uses —
  read that route during planning, don't invent new defaults)
- **How the shared UcapinStudio WA credential actually gets attached to
  each new order-tenant.** `messagingCredentials` (existing table) is
  strictly per-tenant — there's no platform-level credential concept today.
  Simplest option to evaluate during planning: when order creation
  provisions the new tenant, also insert a `messagingCredentials` row for
  it, copying UcapinStudio's own provider config (sourced from an env var
  or a designated "template" row) — no schema change needed, just an extra
  insert in the same transaction as tenant creation. Confirm this is
  workable (and where the platform's own credential value actually lives)
  before committing to it in the plan.
