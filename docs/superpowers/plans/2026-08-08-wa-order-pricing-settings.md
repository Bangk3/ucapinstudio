# Pricing Settings & WhatsApp Order Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every price in the system superadmin-editable through a settings page, and let staff record a WhatsApp-originated "we'll build it for you" order that provisions a dedicated tenant, collects the customer's wedding data and payment proof through a public no-login form, and hands off into the existing invitation editor once paid.

**Architecture:** A new `platform_settings` key-value table replaces the hardcoded constants in `apps/web/lib/pricing.ts`; every existing pricing consumer switches from a static import to an async `getPricingSettings()` read. A new `orders` table (no RLS — same "app-level check only" precedent as `tenants`/`user`) tracks staff-logged orders, gated by a high-entropy `accessToken` for the anonymous customer-facing side and by `requireAdminSession` for the staff side. The public order page uploads photos and payment proof through a new token-gated route that calls the storage adapter directly (the existing `/api/v1/media/upload` route requires a session the customer doesn't have). Everything downstream of "order is paid" — building, templating, publishing, and delivering the invitation, plus broadcasting to the couple's own guest list — reuses existing, unmodified features.

**Tech Stack:** Same as the prior plan in this repo — Next.js 15 API routes, Drizzle ORM (Postgres), Zod validation, `@invyte/storage`'s `uploadImage` called directly (not through its session-gated route wrapper) for the one genuinely new upload path this plan needs.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-wa-order-pricing-settings-design.md` — read it before starting; this plan implements it verbatim, including its two corrections (tenant `type: "organization"` not `"personal"`; the public submit route cannot reuse `/api/v1/media/upload`).
- No WhatsApp bot, webhook parsing, or Baileys — order intake from the initial chat is manual (staff types name/contact); everything else is the customer's own public-form submission, not message parsing.
- No RLS on `orders` or `platform_settings` — deliberate, matches the existing `tenants`/`user` "no RLS, app-level check" precedent (see spec's "orders and platform_settings: no RLS" section). Do not add RLS to these two tables.
- Every money-adjacent staff/admin route pair (approve/reject) uses the atomic single-transaction, row-locked pattern established and fixed mid-plan in the prior implementation (`credit-system-admin-dashboard`) — apply it from the first draft here, do not ship the two-transaction version and wait for a review to catch it.
- `orders.price` is snapshotted from `platform_settings` at order-creation time and never re-derives from a live settings read afterward.
- Match existing code style exactly: `uuidv7()` from `@/lib/uuid` for all new IDs in `apps/web` files, Zod schemas for all request bodies, `NextResponse.json({ error }, { status })` for error shapes, `requireAdminSession` before touching any `/api/v1/admin/*` route's data.
- All new user-facing strings are Bahasa Indonesia, matching the rest of the dashboard and admin panel.

---

## Task 1: Schema — `platform_settings`, `orders`, reserved slug

**Files:**
- Create: `packages/db/src/schema/settings.ts`
- Create: `packages/db/src/schema/orders.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `apps/web/middleware.ts`
- Migration: generated via `pnpm --filter @invyte/db db:generate`

**Interfaces:**
- Produces: `platformSettings` table (`platformSettingKeyEnum`, `PlatformSetting`/`NewPlatformSetting` types), `orders` table (`orderPaymentStatusEnum`, `Order`/`NewOrder` types). Tasks 2–9 import these from `@invyte/db`.

- [ ] **Step 1: Create `packages/db/src/schema/settings.ts`**

```ts
import { pgEnum, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const platformSettingKeyEnum = pgEnum("platform_setting_key", [
  "ai_generation_cost",
  "template_unlock_cost",
  "order_package_price",
  "topup_package_1",
  "topup_package_2",
  "topup_package_3",
]);

export const platformSettings = pgTable("platform_settings", {
  key: platformSettingKeyEnum("key").primaryKey(),
  value: integer("value").notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;
```

- [ ] **Step 2: Create `packages/db/src/schema/orders.ts`**

```ts
import { index, jsonb, pgEnum, pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { invitations } from "./invitations";
import { user } from "./auth";

export const orderPaymentStatusEnum = pgEnum("order_payment_status", [
  "pending",
  "paid",
  "rejected",
]);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    customerContact: text("customer_contact").notNull(),
    notes: text("notes"),
    price: integer("price").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id").references(() => invitations.id, { onDelete: "set null" }),
    accessToken: text("access_token").notNull(),
    submittedData: jsonb("submitted_data"),
    paymentStatus: orderPaymentStatusEnum("payment_status").notNull().default("pending"),
    proofImageUrl: text("proof_image_url"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.paymentStatus, t.createdAt),
    uniqueIndex("orders_access_token_idx").on(t.accessToken),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
```

- [ ] **Step 3: Register both schema files**

Edit `packages/db/src/schema/index.ts`, add after `./credits`:

```ts
export * from "./credits";
export * from "./settings";
export * from "./orders";
```

- [ ] **Step 4: Reserve the `order` slug**

Edit `apps/web/middleware.ts`. Add `"order"` to the existing `RESERVED_SLUGS` set (find the literal `Set([` block that already contains `"admin"`):

```ts
const RESERVED_SLUGS = new Set([
  "system",
  "admin",
  "order",
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
```

- [ ] **Step 5: Generate and apply the migration**

Run (with `.env` exported: `set -a && source .env && set +a`):
```bash
cd packages/db && pnpm db:generate
```
Expected: a new `NNNN_<name>.sql` file appears under `packages/db/migrations/`, containing `CREATE TYPE "platform_setting_key"...`, `CREATE TABLE "platform_settings"...`, `CREATE TYPE "order_payment_status"...`, `CREATE TABLE "orders"...`. Answer "create" for any interactive new-vs-rename prompts (these are genuinely new). Read the generated file to confirm it matches, then apply:

```bash
pnpm db:migrate
```

- [ ] **Step 6: Seed the 6 setting rows with today's hardcoded values**

Do this once against the dev database (not a migration — a one-time data load, since `platform_settings` starts empty and every consumer in Task 3 needs rows to read). Run:

```bash
psql "$DATABASE_URL" <<'EOF'
INSERT INTO platform_settings (key, value) VALUES
  ('ai_generation_cost', 5000),
  ('template_unlock_cost', 15000),
  ('order_package_price', 150000),
  ('topup_package_1', 25000),
  ('topup_package_2', 100000),
  ('topup_package_3', 500000)
ON CONFLICT (key) DO NOTHING;
EOF
```

Also add the equivalent as a one-time step in `packages/db/src/seed.ts` (append after the existing seed logic, using `db.insert(platformSettings).values([...]).onConflictDoNothing()` with the same 6 rows) so a fresh database seeded from scratch gets these automatically — import `platformSettings` from `./index` at the top of `seed.ts` alongside the existing imports.

- [ ] **Step 7: Typecheck and commit**

Run: `pnpm --filter @invyte/db typecheck && pnpm --filter @invyte/web typecheck`

```bash
git add packages/db/src/schema/settings.ts packages/db/src/schema/orders.ts \
  packages/db/src/schema/index.ts packages/db/src/seed.ts \
  packages/db/migrations/ apps/web/middleware.ts
git commit -m "feat(db): add platform_settings and orders tables, reserve order slug"
```

---

## Task 2: Settings read/write — helper + admin route + settings page

**Files:**
- Create: `apps/web/lib/settings.ts`
- Create: `apps/web/app/api/v1/admin/settings/route.ts`
- Create: `apps/web/app/admin/settings/page.tsx`
- Create: `apps/web/components/admin/settings-form.tsx`

**Interfaces:**
- Consumes: `platformSettings`, `db` from `@invyte/db`; `requireAdminSession` from `@/lib/require-admin`
- Produces: `getPricingSettings(): Promise<PricingSettings>` where `PricingSettings = { aiGenerationCost: number; templateUnlockCost: number; orderPackagePrice: number; topupPackages: [number, number, number] }` from `@/lib/settings`. Tasks 3, 5, 6, 8 import this.

- [ ] **Step 1: Write the settings helper**

Create `apps/web/lib/settings.ts`:

```ts
import { db, platformSettings } from "@invyte/db";

export interface PricingSettings {
  aiGenerationCost: number;
  templateUnlockCost: number;
  orderPackagePrice: number;
  topupPackages: [number, number, number];
}

const DEFAULTS: Record<string, number> = {
  ai_generation_cost: 5_000,
  template_unlock_cost: 15_000,
  order_package_price: 150_000,
  topup_package_1: 25_000,
  topup_package_2: 100_000,
  topup_package_3: 500_000,
};

/**
 * Reads all pricing settings fresh from the DB on every call — no caching
 * layer, matching this app's existing precedent (tenant lookups, credit
 * balances) of reading fresh per request rather than pre-optimizing for
 * traffic this project's own stated targets don't require caching for.
 * Falls back to the hardcoded default for any row that's somehow missing
 * (e.g. a fresh DB before the seed step ran) rather than throwing — pricing
 * reads happen on hot paths (AI generation, template unlock) that shouldn't
 * 500 because of a missing settings row.
 */
export async function getPricingSettings(): Promise<PricingSettings> {
  const rows = await db.select().from(platformSettings);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const get = (key: string) => byKey.get(key) ?? DEFAULTS[key]!;

  return {
    aiGenerationCost: get("ai_generation_cost"),
    templateUnlockCost: get("template_unlock_cost"),
    orderPackagePrice: get("order_package_price"),
    topupPackages: [get("topup_package_1"), get("topup_package_2"), get("topup_package_3")],
  };
}
```

- [ ] **Step 2: `PATCH /api/v1/admin/settings`**

Create `apps/web/app/api/v1/admin/settings/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { db, platformSettings } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const KEYS = [
  "ai_generation_cost",
  "template_unlock_cost",
  "order_package_price",
  "topup_package_1",
  "topup_package_2",
  "topup_package_3",
] as const;

const bodySchema = z.object(
  Object.fromEntries(KEYS.map((k) => [k, z.number().int().positive().optional()])) as Record<
    (typeof KEYS)[number],
    z.ZodOptional<z.ZodNumber>
  >,
);

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const rows = await db.select().from(platformSettings);
  return NextResponse.json({ settings: rows });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const now = new Date();
  for (const key of KEYS) {
    const value = parsed.data[key];
    if (value === undefined) continue;
    await db
      .insert(platformSettings)
      .values({ key, value, updatedBy: auth.session.user.id, updatedAt: now })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value, updatedBy: auth.session.user.id, updatedAt: now },
      });
  }

  const rows = await db.select().from(platformSettings);
  return NextResponse.json({ settings: rows });
}
```

- [ ] **Step 3: Settings form component**

Create `apps/web/components/admin/settings-form.tsx`:

```tsx
"use client";

import { useState } from "react";

interface SettingRow {
  key: string;
  value: number;
}

const LABELS: Record<string, string> = {
  ai_generation_cost: "Biaya AI Generate (Rp)",
  template_unlock_cost: "Biaya Unlock Template (Rp)",
  order_package_price: "Harga Paket \"Dibuatkan\" (Rp)",
  topup_package_1: "Paket Top-Up 1 (Rp)",
  topup_package_2: "Paket Top-Up 2 (Rp)",
  topup_package_3: "Paket Top-Up 3 (Rp)",
};

const ORDER = [
  "ai_generation_cost",
  "template_unlock_cost",
  "order_package_price",
  "topup_package_1",
  "topup_package_2",
  "topup_package_3",
];

export function SettingsForm({ initialSettings, canEdit }: { initialSettings: SettingRow[]; canEdit: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSettings.map((s) => [s.key, String(s.value)])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const body: Record<string, number> = {};
      for (const key of ORDER) {
        const n = Number(values[key]);
        if (!Number.isInteger(n) || n <= 0) {
          throw new Error(`${LABELS[key]} harus berupa angka positif`);
        }
        body[key] = n;
      }

      const res = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      {ORDER.map((key) => (
        <div key={key} className="space-y-1.5">
          <label htmlFor={`setting-${key}`} className="text-sm font-medium">
            {LABELS[key]}
          </label>
          <input
            id={`setting-${key}`}
            type="number"
            min={1}
            value={values[key] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
            disabled={!canEdit}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
      ))}

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Tersimpan.</p>}

      {canEdit && (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Settings page**

Create `apps/web/app/admin/settings/page.tsx`:

```tsx
import { SettingsForm } from "@/components/admin/settings-form";
import { getServerSession } from "@/lib/session";
import { db, platformSettings } from "@invyte/db";

export default async function AdminSettingsPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  const rows = await db.select().from(platformSettings);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <SettingsForm
        initialSettings={rows.map((r) => ({ key: r.key, value: r.value }))}
        canEdit={role === "superadmin"}
      />
    </div>
  );
}
```

Note: this page reads `platformSettings` directly rather than calling `getPricingSettings()` — it needs the raw per-key rows (including any keys not yet seeded, defaulting to 0/empty in the form) for editing, not the merged-with-defaults shape `getPricingSettings()` returns for consumption elsewhere.

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/lib/settings.ts apps/web/app/api/v1/admin/settings \
  apps/web/app/admin/settings apps/web/components/admin/settings-form.tsx
git commit -m "feat: add pricing settings read/write helper, admin route, and settings page"
```

---

## Task 3: Migrate every pricing consumer off the hardcoded constants

**Files:**
- Modify: `apps/web/app/api/v1/invitations/[id]/ai/generate/route.ts`
- Modify: `apps/web/app/api/v1/tenant/templates/[templateId]/unlock/route.ts`
- Modify: `apps/web/app/api/v1/tenant/topup-requests/route.ts`
- Modify: `apps/web/components/billing/topup-form.tsx`
- Modify: `apps/web/app/[tenant]/dashboard/billing/page.tsx`
- Modify: `apps/web/components/invitations/new-invitation-form.tsx`
- Modify: `apps/web/app/[tenant]/dashboard/invitations/new/page.tsx`
- Modify: `apps/web/components/invitations/editor-sections/editor-theme.tsx`
- Modify: `apps/web/components/invitations/invitation-editor.tsx`
- Modify: `apps/web/app/[tenant]/dashboard/invitations/[id]/page.tsx`
- Delete: `apps/web/lib/pricing.ts`

**Interfaces:**
- Consumes: `getPricingSettings` from `@/lib/settings` (Task 2)

This task is a mechanical but wide-reaching swap: every file that imported a constant from `apps/web/lib/pricing.ts` now either calls `getPricingSettings()` directly (server-side files) or receives the relevant number as a new prop threaded from a server-component ancestor (client components, following the exact pattern `creditBalance`/`unlockedTemplateIds` already use in this codebase).

- [ ] **Step 1: AI generation route**

Edit `apps/web/app/api/v1/invitations/[id]/ai/generate/route.ts`. Replace:

```ts
import { AI_GENERATION_COST_RUPIAH } from "@/lib/pricing";
```

with:

```ts
import { getPricingSettings } from "@/lib/settings";
```

Find the block that reads `tenantRow` and checks the balance (around the existing `if (!tenantRow || tenantRow.creditBalance < AI_GENERATION_COST_RUPIAH)` line). Immediately before that block, add:

```ts
  const { aiGenerationCost } = await getPricingSettings();
```

Then replace every remaining use of `AI_GENERATION_COST_RUPIAH` in the file (the balance check, the error message, and the `debitCredit(tenantId, AI_GENERATION_COST_RUPIAH, ...)` call) with `aiGenerationCost`.

- [ ] **Step 2: Template unlock route**

Edit `apps/web/app/api/v1/tenant/templates/[templateId]/unlock/route.ts`. Replace:

```ts
import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
```

with:

```ts
import { getPricingSettings } from "@/lib/settings";
```

Before the `debitCreditInTx(...)` call (or wherever the transaction body needs the cost value — read the current file to find the exact spot, it was written in the prior plan's Task 6 fix round), add:

```ts
  const { templateUnlockCost } = await getPricingSettings();
```

and pass `templateUnlockCost` instead of `TEMPLATE_UNLOCK_COST_RUPIAH` to `debitCreditInTx`/`creditTopupInTx` (whichever the current file uses) and any response body that echoes the price.

- [ ] **Step 3: Top-up submission route**

Edit `apps/web/app/api/v1/tenant/topup-requests/route.ts`. Replace:

```ts
import { TOPUP_PACKAGES_RUPIAH } from "@/lib/pricing";
```

with:

```ts
import { getPricingSettings } from "@/lib/settings";
```

The existing `bodySchema` uses a `.refine()` against `TOPUP_PACKAGES_RUPIAH` at module-load time — since the valid set is now a runtime DB value, this validation has to move inside the request handler instead of living in a module-level schema. Change the schema to just validate shape:

```ts
const bodySchema = z.object({
  tenantSlug: z.string().min(1),
  packageAmount: z.number().int().positive(),
  proofImageUrl: z.string().url(),
});
```

Then in the `POST` handler, after `const parsed = bodySchema.safeParse(body);` succeeds, add a runtime check:

```ts
  const { topupPackages } = await getPricingSettings();
  if (!topupPackages.includes(parsed.data.packageAmount)) {
    return NextResponse.json({ error: "packageAmount harus salah satu paket yang tersedia" }, { status: 422 });
  }
```

- [ ] **Step 4: Top-up form + billing page (client prop threading)**

Edit `apps/web/app/[tenant]/dashboard/billing/page.tsx` — add the settings read and pass the packages down:

```tsx
import { getPricingSettings } from "@/lib/settings";
```

Add `const { topupPackages } = await getPricingSettings();` alongside the existing `getTenantBySlug` call, and pass `topupPackages={topupPackages}` to `<TopupForm />`.

Edit `apps/web/components/billing/topup-form.tsx`. Remove:

```ts
import { TOPUP_PACKAGES_RUPIAH } from "@/lib/pricing";
```

Add `topupPackages: [number, number, number];` to the `Props` interface and destructure it in the component signature. Replace every use of `TOPUP_PACKAGES_RUPIAH` in the file body (the `useState` initializer and the `.map(...)` over packages) with `topupPackages`.

- [ ] **Step 5: New-invitation form + its page**

Edit `apps/web/app/[tenant]/dashboard/invitations/new/page.tsx` — add:

```tsx
import { getPricingSettings } from "@/lib/settings";
```

Add `const { templateUnlockCost } = await getPricingSettings();` and pass `templateUnlockCost={templateUnlockCost}` to `<NewInvitationForm />`.

Edit `apps/web/components/invitations/new-invitation-form.tsx`. Remove:

```ts
import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
```

Add `templateUnlockCost: number;` to `Props`, destructure it, replace the one use of `TEMPLATE_UNLOCK_COST_RUPIAH` (the lock-badge price display) with `templateUnlockCost`.

- [ ] **Step 6: Editor theme panel + its ancestors**

Edit `apps/web/app/[tenant]/dashboard/invitations/[id]/page.tsx` — add:

```tsx
import { getPricingSettings } from "@/lib/settings";
```

Add `const { templateUnlockCost } = await getPricingSettings();` and pass `templateUnlockCost={templateUnlockCost}` to `<InvitationEditor />`.

Edit `apps/web/components/invitations/invitation-editor.tsx` — add `templateUnlockCost: number;` to `Props`, destructure it in the function signature, and pass it through to the existing `<EditorTheme />` call (`templateUnlockCost={templateUnlockCost}`, alongside the `unlockedTemplateIds` prop already threaded there from the prior plan).

Edit `apps/web/components/invitations/editor-sections/editor-theme.tsx`. Remove:

```ts
import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
```

Add `templateUnlockCost: number;` to `Props`, destructure it, replace the one use of `TEMPLATE_UNLOCK_COST_RUPIAH` with `templateUnlockCost`.

- [ ] **Step 7: Delete the now-unused constants file**

```bash
rm apps/web/lib/pricing.ts
```

Run `grep -rn "lib/pricing" apps/web` to confirm zero remaining references before proceeding — if anything still imports it, that file was missed above and needs the same treatment.

- [ ] **Step 8: Typecheck**

Run: `pnpm --filter @invyte/web typecheck`
Expected: no errors. If any file still references `TOPUP_PACKAGES_RUPIAH`/`TEMPLATE_UNLOCK_COST_RUPIAH`/`AI_GENERATION_COST_RUPIAH`/`@/lib/pricing`, that's a missed call site — the grep in Step 7 should have caught it, but the typecheck is the final backstop.

- [ ] **Step 9: Manual verification**

With the dev server running and `.env` exported: as `superadmin`, change a value on `/admin/settings` (e.g. bump `ai_generation_cost` to 6000), save, then trigger AI generation on a tenant with enough balance — confirm the 402/success math uses 6000, not 5000. Revert the setting back afterward so the rest of this plan's manual tests use the original defaults.

- [ ] **Step 10: Commit**

```bash
git add apps/web/app/api/v1/invitations/\[id\]/ai/generate/route.ts \
  apps/web/app/api/v1/tenant/templates/\[templateId\]/unlock/route.ts \
  apps/web/app/api/v1/tenant/topup-requests/route.ts \
  apps/web/components/billing/topup-form.tsx \
  apps/web/app/\[tenant\]/dashboard/billing/page.tsx \
  apps/web/components/invitations/new-invitation-form.tsx \
  apps/web/app/\[tenant\]/dashboard/invitations/new/page.tsx \
  apps/web/components/invitations/editor-sections/editor-theme.tsx \
  apps/web/components/invitations/invitation-editor.tsx \
  apps/web/app/\[tenant\]/dashboard/invitations/\[id\]/page.tsx
git rm apps/web/lib/pricing.ts
git commit -m "refactor: read all pricing from platform_settings instead of hardcoded constants"
```

---

## Task 4: Order creation — tenant provisioning + shared WA credential

**Files:**
- Create: `apps/web/app/api/v1/admin/orders/route.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `getPricingSettings` from `@/lib/settings`; `requireAdminSession` from `@/lib/require-admin`; `encrypt` from `@/lib/encrypt`; `db`, `orders`, `tenants`, `memberships`, `messagingCredentials` from `@invyte/db`; `uuidv7` from `@/lib/uuid`
- Produces: `POST /api/v1/admin/orders`. Tasks 5, 6, 7, 9 build on the `orders` rows this creates.

- [ ] **Step 1: Token generator**

This is a one-line addition, not worth its own file: use Node's built-in `crypto.randomBytes` directly in the route (Step 3) rather than adding a helper module for a single call site.

- [ ] **Step 2: Resolve the platform WA credential source**

This plan reuses the existing WhatsApp Cloud API env vars already documented in `.env.example` (`WA_CLOUD_API_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_BUSINESS_ACCOUNT_ID`) as UcapinStudio's own shared credential, rather than introducing new env vars — resolving the spec's deferred "where does the shared credential come from" question. Edit `.env.example`, update the comment on the existing WhatsApp section to note the dual purpose:

```
# WhatsApp (optional, for Phase 2). Also used as UcapinStudio's own shared
# provider for guest broadcasts on staff-created "WA order" tenants — see
# docs/superpowers/specs/2026-08-08-wa-order-pricing-settings-design.md.
WA_CLOUD_API_TOKEN=
WA_PHONE_NUMBER_ID=
WA_BUSINESS_ACCOUNT_ID=
```

If `WA_PHONE_NUMBER_ID`/`WA_CLOUD_API_TOKEN` are unset in a given deployment (true for local dev, since these are genuinely optional/Phase 2), order creation still succeeds — it just skips inserting a `messagingCredentials` row for the new tenant (see Step 3), so broadcast simply isn't available yet on that tenant until either these env vars are set deployment-wide or that specific customer is given their own account to configure their own provider (per the spec's Operational Notes).

- [ ] **Step 3: `POST /api/v1/admin/orders`**

Create `apps/web/app/api/v1/admin/orders/route.ts`:

```ts
import { randomBytes } from "node:crypto";
import { encrypt } from "@/lib/encrypt";
import { requireAdminSession } from "@/lib/require-admin";
import { getPricingSettings } from "@/lib/settings";
import { uuidv7 } from "@/lib/uuid";
import { db, memberships, messagingCredentials, orders, tenants } from "@invyte/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  customerName: z.string().min(1).max(255),
  customerContact: z.string().min(1).max(255),
  notes: z.string().max(2000).optional(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function uniqueTenantSlug(base: string): Promise<string> {
  let slug = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}`;
  let attempt = 0;
  // Extremely unlikely to collide given the random suffix, but check anyway
  // rather than trusting randomness alone for a uniqueness constraint.
  while (true) {
    const [existing] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!existing) return slug;
    attempt++;
    slug = `${slugify(base)}-${Math.random().toString(36).slice(2, 6)}-${attempt}`;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { customerName, customerContact, notes } = parsed.data;

  const { orderPackagePrice } = await getPricingSettings();
  const tenantSlug = await uniqueTenantSlug(customerName);
  const tenantId = uuidv7();
  const orderId = uuidv7();
  const accessToken = randomBytes(32).toString("base64url");
  const now = new Date();

  await db.insert(tenants).values({
    id: tenantId,
    slug: tenantSlug,
    name: customerName,
    type: "organization",
    plan: "free",
    settings: { source: "staff_order" },
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(memberships).values({
    userId: auth.session.user.id,
    tenantId,
    role: "owner",
    joinedAt: now,
  });

  // Attach UcapinStudio's shared WhatsApp credential, if configured, so
  // broadcast to the couple's guest list works with zero extra setup.
  // Silently skipped if unset — see Step 2's note.
  if (process.env.WA_CLOUD_API_TOKEN && process.env.WA_PHONE_NUMBER_ID) {
    await db.insert(messagingCredentials).values({
      id: uuidv7(),
      tenantId,
      provider: "whatsapp_cloud",
      encryptedConfig: encrypt(
        JSON.stringify({
          phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
          accessToken: process.env.WA_CLOUD_API_TOKEN,
        }),
      ),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const [order] = await db
    .insert(orders)
    .values({
      id: orderId,
      customerName,
      customerContact,
      notes: notes ?? null,
      price: orderPackagePrice,
      createdBy: auth.session.user.id,
      tenantId,
      accessToken,
      paymentStatus: "pending",
      createdAt: now,
    })
    .returning();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json(
    { order, publicUrl: `${appUrl}/order/${accessToken}` },
    { status: 201 },
  );
}
```

Add the missing `eq` import from `drizzle-orm` at the top of the file (`import { eq } from "drizzle-orm";`) — needed by `uniqueTenantSlug`.

Note this whole sequence (tenant + membership + optional credential + order insert) is **not** wrapped in a single DB transaction. Unlike the money-handling flows elsewhere in this codebase, an interrupted sequence here (e.g. tenant created but the order insert fails) leaves an orphaned tenant with no matching order — undesirable but not a money-safety or security issue, just cleanup debt an admin could notice and delete manually. Wrapping this in a transaction is straightforward if it turns out to matter in practice (all four statements already use the same `db` client) — not doing it preemptively here since none of these statements can fail for a data-dependent reason (no unique-constraint races like the credit ledger had), only for infrastructure reasons a transaction wouldn't meaningfully protect against differently.

- [ ] **Step 4: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/admin/orders/route.ts .env.example
git commit -m "feat: add order creation route with tenant provisioning and shared WA credential"
```

---

## Task 5: Public order routes — token-gated read + multipart submit

**Files:**
- Create: `apps/web/app/api/v1/orders/[token]/route.ts`
- Create: `apps/web/app/api/v1/orders/[token]/submit/route.ts`

**Interfaces:**
- Consumes: `orders`, `db`, `media` from `@invyte/db`; `uploadImage` from `@invyte/storage`; `uuidv7` from `@/lib/uuid`
- Produces: `GET /api/v1/orders/[token]`, `POST /api/v1/orders/[token]/submit`. Task 6 (public page) calls both.

- [ ] **Step 1: Public read route**

Create `apps/web/app/api/v1/orders/[token]/route.ts`:

```ts
import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only fields the public page needs — never customerContact, notes,
  // tenantId, createdBy, or anything else internal.
  return NextResponse.json({
    customerName: order.customerName,
    price: order.price,
    paymentStatus: order.paymentStatus,
    hasSubmittedData: order.submittedData !== null,
    hasProof: order.proofImageUrl !== null,
  });
}
```

- [ ] **Step 2: Public multipart submit route**

Create `apps/web/app/api/v1/orders/[token]/submit/route.ts`. This is the one route in the whole plan that uploads files without an authenticated session — it calls `uploadImage` from `@invyte/storage` directly instead of going through the session-gated `/api/v1/media/upload` route, per the spec's correction:

```ts
import { db, media, orders } from "@invyte/db";
import { uploadImage } from "@invyte/storage";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { uuidv7 } from "@/lib/uuid";

type Ctx = { params: Promise<{ token: string }> };

const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  date: z.string().optional(),
  time: z.string().optional(),
  venueName: z.string().max(255).optional(),
  venueAddress: z.string().max(500).optional(),
});

const submittedDataSchema = z.object({
  hosts: z.object({
    groomName: z.string().min(1).max(255),
    brideName: z.string().min(1).max(255),
    groomFull: z.string().max(255).optional(),
    brideFull: z.string().max(255).optional(),
    groomParents: z.string().max(255).optional(),
    brideParents: z.string().max(255).optional(),
  }),
  events: z.array(eventSchema).min(1),
  story: z.string().max(5000).optional(),
});

async function uploadOneImage(tenantId: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(tenantId, buffer, "order-submission");

  await db.insert(media).values({
    id: uuidv7(),
    tenantId,
    type: "image",
    storageKey: result.key,
    ...(result.url !== undefined ? { publicUrl: result.url } : {}),
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    ...(result.width !== undefined ? { width: result.width } : {}),
    ...(result.height !== undefined ? { height: result.height } : {}),
    variants: result.variants as Record<string, string>,
    createdAt: new Date(),
  });

  if (!result.url) throw new Error("Upload succeeded but no public URL was returned");
  return result.url;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const submittedDataRaw = formData.get("submittedData");
  if (typeof submittedDataRaw !== "string") {
    return NextResponse.json({ error: "submittedData wajib diisi" }, { status: 422 });
  }
  const parsedSubmitted = submittedDataSchema.safeParse(JSON.parse(submittedDataRaw));
  if (!parsedSubmitted.success) {
    return NextResponse.json({ error: parsedSubmitted.error.flatten() }, { status: 422 });
  }

  const proofFile = formData.get("proofImage");
  if (!(proofFile instanceof File)) {
    return NextResponse.json({ error: "Bukti transfer wajib diupload" }, { status: 422 });
  }

  const galleryFiles = formData.getAll("galleryImages").filter((f): f is File => f instanceof File);

  let proofImageUrl: string;
  const galleryUrls: string[] = [];
  try {
    proofImageUrl = await uploadOneImage(order.tenantId, proofFile);
    for (const file of galleryFiles) {
      galleryUrls.push(await uploadOneImage(order.tenantId, file));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const submittedData = { ...parsedSubmitted.data, galleryUrls };

  await db
    .update(orders)
    .set({ submittedData, proofImageUrl })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ ok: true });
}
```

Note: `EventInfo.id` (required by `@invyte/templates`'s type) is supplied by the **client** in this design — the public page generates a simple string id per event row it renders (e.g. `crypto.randomUUID()` in the browser, or an incrementing counter converted to a string) before submitting, so the server-side `eventSchema` can require `id` as a plain string without needing to invent one itself. Task 6's page implementation must set this when building the events array.

- [ ] **Step 3: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/orders
git commit -m "feat: add public token-gated order read and multipart submit routes"
```

---

## Task 6: Public order page (`/order/[token]`)

**Files:**
- Create: `apps/web/app/order/[token]/page.tsx`
- Create: `apps/web/components/orders/order-intake-form.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/orders/[token]`, `POST /api/v1/orders/[token]/submit` (Task 5)

- [ ] **Step 1: Server page shell**

Create `apps/web/app/order/[token]/page.tsx`:

```tsx
import { OrderIntakeForm } from "@/components/orders/order-intake-form";
import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicOrderPage({ params }: Props) {
  const { token } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) notFound();

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50/40 px-6 py-16">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-serif font-semibold text-stone-800">
            Data Undangan — {order.customerName}
          </h1>
          <p className="text-sm text-stone-600">
            Harga paket: Rp {order.price.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <OrderIntakeForm
            token={token}
            alreadySubmitted={order.submittedData !== null}
            paymentStatus={order.paymentStatus}
          />
        </div>
      </div>
    </main>
  );
}
```

This page reads `orders` directly (no RLS on this table, no auth needed — the token itself, already validated by the fact this page rendered at all, is the access control) rather than going through the `GET /api/v1/orders/[token]` route — that route exists for the **client-side** re-checks the form component does after submitting, not for this initial server render.

- [ ] **Step 2: Intake form component**

Create `apps/web/components/orders/order-intake-form.tsx`:

```tsx
"use client";

import { useState } from "react";

interface EventRow {
  id: string;
  name: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
}

function newEvent(): EventRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    date: "",
    time: "",
    venueName: "",
    venueAddress: "",
  };
}

interface Props {
  token: string;
  alreadySubmitted: boolean;
  paymentStatus: "pending" | "paid" | "rejected";
}

export function OrderIntakeForm({ token, alreadySubmitted, paymentStatus }: Props) {
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [story, setStory] = useState("");
  const [events, setEvents] = useState<EventRow[]>([newEvent()]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadySubmitted);

  function updateEvent(id: string, patch: Partial<EventRow>) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function handleSubmit() {
    setError(null);
    if (!groomName.trim() || !brideName.trim()) {
      setError("Nama mempelai wajib diisi");
      return;
    }
    if (!proofFile) {
      setError("Bukti transfer wajib diupload");
      return;
    }

    setSubmitting(true);
    try {
      const submittedData = {
        hosts: { groomName: groomName.trim(), brideName: brideName.trim() },
        events: events
          .filter((e) => e.name.trim())
          .map((e) => ({
            id: e.id,
            name: e.name.trim(),
            ...(e.date ? { date: e.date } : {}),
            ...(e.time ? { time: e.time } : {}),
            ...(e.venueName ? { venueName: e.venueName } : {}),
            ...(e.venueAddress ? { venueAddress: e.venueAddress } : {}),
          })),
        ...(story.trim() ? { story: story.trim() } : {}),
      };

      const formData = new FormData();
      formData.append("submittedData", JSON.stringify(submittedData));
      formData.append("proofImage", proofFile);
      for (const file of galleryFiles) formData.append("galleryImages", file);

      const res = await fetch(`/api/v1/orders/${token}/submit`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof body.error === "string" ? body.error : "Gagal mengirim");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-2 py-8">
        <p className="text-lg font-medium">Terkirim!</p>
        <p className="text-sm text-muted-foreground">
          {paymentStatus === "paid"
            ? "Pembayaran sudah dikonfirmasi. Tim kami sedang menyiapkan undangan Anda."
            : "Kami akan segera memproses pembayaran dan data Anda."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="groom-name" className="text-sm font-medium">
            Nama Mempelai Pria
          </label>
          <input
            id="groom-name"
            value={groomName}
            onChange={(e) => setGroomName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bride-name" className="text-sm font-medium">
            Nama Mempelai Wanita
          </label>
          <input
            id="bride-name"
            value={brideName}
            onChange={(e) => setBrideName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Acara</p>
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border p-3 space-y-2">
            <input
              placeholder="Nama acara (mis. Akad, Resepsi)"
              value={event.name}
              onChange={(e) => updateEvent(event.id, { name: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={event.date}
                onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <input
                type="time"
                value={event.time}
                onChange={(e) => updateEvent(event.id, { time: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              placeholder="Nama lokasi"
              value={event.venueName}
              onChange={(e) => updateEvent(event.id, { venueName: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Alamat lengkap"
              value={event.venueAddress}
              onChange={(e) => updateEvent(event.id, { venueAddress: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEvents((prev) => [...prev, newEvent()])}
          className="text-xs font-medium text-primary hover:underline"
        >
          + Tambah acara
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="story" className="text-sm font-medium">
          Cerita Singkat (opsional)
        </label>
        <textarea
          id="story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="gallery" className="text-sm font-medium">
          Foto Pasangan (boleh lebih dari satu)
        </label>
        <input
          id="gallery"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
        <p className="font-medium">Transfer ke:</p>
        <p className="text-muted-foreground">[ISI NOMOR REKENING DI SINI]</p>
        <p className="text-muted-foreground">[ISI QRIS/INFO PEMBAYARAN LAIN DI SINI]</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="proof" className="text-sm font-medium">
          Bukti Transfer
        </label>
        <input
          id="proof"
          type="file"
          accept="image/*"
          onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {submitting ? "Mengirim..." : "Kirim"}
      </button>
    </div>
  );
}
```

Placeholder payment text is intentionally identical to `topup-form.tsx`'s — the same real values, once Kelvin has them, apply to both.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @invyte/web typecheck`

- [ ] **Step 4: Manual verification**

Requires an order already created (Task 4's route, callable via curl since Task 9's UI doesn't exist yet at this point in the plan — `curl -X POST http://localhost:3001/api/v1/admin/orders -H "Content-Type: application/json" -d '{"customerName":"Test Customer","customerContact":"08123"}'` with a valid superadmin/admin session cookie). Open the returned `publicUrl`, fill the form, upload a real image + proof, submit — confirm `orders.submitted_data`/`proof_image_url` are populated in Postgres and `media` rows exist with the right `tenantId`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/order apps/web/components/orders
git commit -m "feat: add public order intake page"
```

---

## Task 7: Order payment approve/reject (atomic from the start)

**Files:**
- Create: `apps/web/app/api/v1/admin/orders/[id]/approve/route.ts`
- Create: `apps/web/app/api/v1/admin/orders/[id]/reject/route.ts`
- Create: `apps/web/app/api/v1/admin/orders/route.ts` (GET only — list, if not already covered; check Task 4's file first, this may already exist as the same file with POST)

**Interfaces:**
- Consumes: `requireAdminSession`, `orders`, `db` from `@invyte/db`

- [ ] **Step 1: Check whether the list-orders GET already exists**

Task 4 created `apps/web/app/api/v1/admin/orders/route.ts` with only a `POST` handler. Read that file now — if a `GET` isn't already there, add one in this task (staff need to see the order queue). Add to that same file:

```ts
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const statusFilter = req.nextUrl.searchParams.get("status");
  const base = db
    .select({ order: orders, tenantSlug: tenants.slug })
    .from(orders)
    .innerJoin(tenants, eq(orders.tenantId, tenants.id))
    .orderBy(desc(orders.createdAt));

  const rows = statusFilter
    ? await base.where(eq(orders.paymentStatus, statusFilter as "pending" | "paid" | "rejected"))
    : await base;

  return NextResponse.json({ orders: rows });
}
```

Add `tenants`, `desc` to the file's existing imports (`tenants` from `@invyte/db`, `desc` from `drizzle-orm`, alongside the already-imported `eq`).

- [ ] **Step 2: Approve route**

Create `apps/web/app/api/v1/admin/orders/[id]/approve/route.ts`. This follows the exact single-transaction, row-locked pattern the prior plan's Task 7 established for top-up approval — applied here from the first draft, no separate fix round needed:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

class AlreadyProcessedError extends Error {}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  try {
    const updated = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");

      if (!order || order.paymentStatus !== "pending") {
        throw new AlreadyProcessedError();
      }

      const [row] = await tx
        .update(orders)
        .set({ paymentStatus: "paid", reviewedBy: auth.session.user.id, reviewedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      return row;
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    if (err instanceof AlreadyProcessedError) {
      return NextResponse.json({ error: "Order tidak ditemukan atau sudah diproses" }, { status: 409 });
    }
    throw err;
  }
}
```

Note this uses a plain `db.transaction(...)` rather than `withTenantRls`/`withAdminDb` — `orders` has no RLS at all (Global Constraints), so there's no session variable to set; a bare transaction with the row lock is sufficient and correct here, unlike the credit-ledger flows that needed `withTenantRls` specifically to satisfy `credit_transactions`'/`topup_requests`' RLS policies.

- [ ] **Step 3: Reject route**

Create `apps/web/app/api/v1/admin/orders/[id]/reject/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { db, orders } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

class AlreadyProcessedError extends Error {}

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ reason: z.string().min(1).max(500) });

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const updated = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");

      if (!order || order.paymentStatus !== "pending") {
        throw new AlreadyProcessedError();
      }

      const [row] = await tx
        .update(orders)
        .set({
          paymentStatus: "rejected",
          reviewedBy: auth.session.user.id,
          reviewedAt: new Date(),
          rejectionReason: parsed.data.reason,
        })
        .where(eq(orders.id, id))
        .returning();

      return row;
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    if (err instanceof AlreadyProcessedError) {
      return NextResponse.json({ error: "Order tidak ditemukan atau sudah diproses" }, { status: 409 });
    }
    throw err;
  }
}
```

- [ ] **Step 4: Typecheck and commit**

Run: `pnpm --filter @invyte/web typecheck`

```bash
git add apps/web/app/api/v1/admin/orders
git commit -m "feat: add order payment approve/reject routes (atomic, row-locked)"
```

---

## Task 8: Create invitation from order + revenue metric fix

**Files:**
- Create: `apps/web/app/api/v1/admin/orders/[id]/create-invitation/route.ts`
- Modify: `apps/web/app/api/v1/admin/overview/route.ts`
- Modify: `apps/web/app/admin/page.tsx`

**Interfaces:**
- Consumes: `orders`, `invitations`, `db` from `@invyte/db`; `uuidv7` from `@/lib/uuid`; `requireAdminSession`

- [ ] **Step 1: Create-invitation-from-order route**

Create `apps/web/app/api/v1/admin/orders/[id]/create-invitation/route.ts`:

```ts
import { requireAdminSession } from "@/lib/require-admin";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, orders, tenants } from "@invyte/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Pembayaran order belum disetujui" }, { status: 402 });
  }
  if (order.invitationId) {
    return NextResponse.json({ error: "Undangan sudah pernah dibuat untuk order ini" }, { status: 409 });
  }

  const [tenant] = await db.select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, order.tenantId)).limit(1);
  if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });

  const submitted = order.submittedData as {
    hosts: { groomName: string; brideName: string };
    events: Array<{ id: string; name: string }>;
    story?: string;
    galleryUrls?: string[];
  } | null;

  const invitationId = uuidv7();
  const now = new Date();

  const [invitation] = await db
    .insert(invitations)
    .values({
      id: invitationId,
      tenantId: order.tenantId,
      name: `Pernikahan ${order.customerName}`,
      slug: `undangan-${invitationId.slice(0, 8)}`,
      kind: "wedding",
      templateId: "minimalist-modern",
      status: "draft",
      content: submitted
        ? {
            hosts: submitted.hosts,
            events: submitted.events,
            ...(submitted.story ? { story: submitted.story } : {}),
            ...(submitted.galleryUrls ? { galleryUrls: submitted.galleryUrls } : {}),
          }
        : { hosts: { groomName: "", brideName: "" }, events: [] },
      theme: {},
      settings: {},
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.update(orders).set({ invitationId }).where(eq(orders.id, id));

  return NextResponse.json({ invitation, tenantSlug: tenant.slug }, { status: 201 });
}
```

- [ ] **Step 2: Revenue metric — include paid orders**

Edit `apps/web/app/api/v1/admin/overview/route.ts`. Read the current file first (it was built in the prior plan's Task 8). Add a second revenue query alongside the existing `credit_transactions`-based one:

```ts
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [orderRevenueRow] = await withAdminDb((tx) =>
    tx
      .select({ total: sql<string>`COALESCE(SUM(price), 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.reviewedAt, startOfMonth))),
  );
```

(`startOfMonth` almost certainly already exists in this file from the prior plan — reuse it, don't redeclare.) Then change the final `revenueThisMonth` computation from just the credit-transactions sum to the sum of both:

```ts
    revenueThisMonth: Number(revenueRow?.total ?? 0) + Number(orderRevenueRow?.total ?? 0),
```

Add `orders` to the file's existing `@invyte/db` import list.

- [ ] **Step 3: Same fix in the overview page's direct-query version**

`apps/web/app/admin/page.tsx` duplicates this same query logic as a server component (per the prior plan's deliberate choice to avoid a self-fetch — see that plan's Task 11 note). Apply the identical change there: add the `orderRevenueRow` query using `orders`/`withAdminDb`, add `orders` to its `@invyte/db` import, and update the `revenueThisMonth` field in the returned object the same way.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @invyte/web typecheck`

- [ ] **Step 5: Manual verification**

Using an order already approved in Task 7's manual test: call `create-invitation`, confirm the returned invitation's `content.hosts`/`content.events` match what was submitted in Task 6's test. Load `/admin` as superadmin, confirm "Revenue This Month" now includes that order's price on top of any credit top-ups already counted.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/v1/admin/orders/\[id\]/create-invitation \
  apps/web/app/api/v1/admin/overview/route.ts apps/web/app/admin/page.tsx
git commit -m "feat: add create-invitation-from-order action, fix revenue metric to include orders"
```

---

## Task 9: `/admin/orders` page + nav entries

**Files:**
- Create: `apps/web/app/admin/orders/page.tsx`
- Create: `apps/web/components/admin/orders-panel.tsx`
- Create: `apps/web/components/admin/order-form.tsx`
- Create: `apps/web/components/admin/order-queue.tsx`
- Modify: `apps/web/components/admin/nav.tsx`

**Interfaces:**
- Consumes: `POST/GET /api/v1/admin/orders`, `POST .../approve`, `POST .../reject`, `POST .../create-invitation` (Tasks 4, 7, 8)

- [ ] **Step 1: Order creation form component**

Create `apps/web/components/admin/order-form.tsx`:

```tsx
"use client";

import { useState } from "react";

export function OrderForm({ onCreated }: { onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!customerName.trim() || !customerContact.trim()) {
      setError("Nama dan kontak customer wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerContact: customerContact.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof body.error === "string" ? body.error : "Gagal membuat order");
      }
      const data = (await res.json()) as { publicUrl: string };
      setPublicUrl(data.publicUrl);
      setCustomerName("");
      setCustomerContact("");
      setNotes("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <p className="font-medium text-sm">Buat Order Baru</p>
      <input
        placeholder="Nama customer"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
      <input
        placeholder="Kontak (nomor WA)"
        value={customerContact}
        onChange={(e) => setCustomerContact(e.target.value)}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Catatan (opsional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitting ? "Membuat..." : "Buat Order"}
      </button>

      {publicUrl && (
        <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2">
          <code className="text-xs flex-1 truncate">{publicUrl}</code>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-md border px-2 py-1 text-xs font-medium shrink-0"
          >
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Order queue component**

Create `apps/web/components/admin/order-queue.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface OrderRow {
  order: {
    id: string;
    customerName: string;
    price: number;
    paymentStatus: "pending" | "paid" | "rejected";
    proofImageUrl: string | null;
    invitationId: string | null;
  };
  tenantSlug: string;
}

export function OrderQueue({ canApprove, refreshKey }: { canApprove: boolean; refreshKey: number }) {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/v1/admin/orders");
    const data = (await res.json()) as { orders: OrderRow[] };
    setRows(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [refreshKey]);

  async function approve(id: string) {
    setActioningId(id);
    await fetch(`/api/v1/admin/orders/${id}/approve`, { method: "POST" });
    await load();
    setActioningId(null);
  }

  async function reject(id: string) {
    const reason = window.prompt("Alasan penolakan:");
    if (!reason) return;
    setActioningId(id);
    await fetch(`/api/v1/admin/orders/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    await load();
    setActioningId(null);
  }

  async function createInvitation(id: string, tenantSlug: string) {
    setActioningId(id);
    const res = await fetch(`/api/v1/admin/orders/${id}/create-invitation`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { invitation: { id: string } };
      window.location.href = `/${tenantSlug}/dashboard/invitations/${data.invitation.id}`;
      return;
    }
    await load();
    setActioningId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat...</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Belum ada order.</p>;

  return (
    <div className="space-y-3">
      {rows.map(({ order, tenantSlug }) => (
        <div key={order.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">
              Rp {order.price.toLocaleString("id-ID")} ·{" "}
              {order.paymentStatus === "pending"
                ? "Menunggu"
                : order.paymentStatus === "paid"
                  ? "Lunas"
                  : "Ditolak"}
              {!order.proofImageUrl && order.paymentStatus === "pending" ? " · belum ada bukti" : ""}
            </p>
          </div>
          {canApprove && order.paymentStatus === "pending" && order.proofImageUrl && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void approve(order.id)}
                disabled={actioningId === order.id}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => void reject(order.id)}
                disabled={actioningId === order.id}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
          {order.paymentStatus === "paid" && !order.invitationId && (
            <button
              type="button"
              onClick={() => void createInvitation(order.id, tenantSlug)}
              disabled={actioningId === order.id}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60 shrink-0"
            >
              Buat Undangan
            </button>
          )}
          {order.invitationId && (
            <a
              href={`/${tenantSlug}/dashboard/invitations/${order.invitationId}`}
              className="text-xs font-medium text-primary hover:underline shrink-0"
            >
              Buka Undangan
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

Note "Buat Undangan" is visible regardless of `canApprove` — per the spec, both `admin` and `superadmin` can create orders and invitations, only payment approval is `superadmin`-only.

- [ ] **Step 3: Orders page**

Create `apps/web/app/admin/orders/page.tsx`:

First, a small client wrapper that owns the `refreshKey` coordination between the
create-form and the queue — everything else about role-gating stays server-side,
matching every other `/admin/*` page in this codebase (`topup-requests/page.tsx`,
`users/page.tsx` both read the session server-side and pass a `canApprove`/
`canModerate` boolean prop down; this page follows the identical pattern rather
than introducing a new client-side `useSession()` read).

Create `apps/web/components/admin/orders-panel.tsx`:

```tsx
"use client";

import { OrderForm } from "@/components/admin/order-form";
import { OrderQueue } from "@/components/admin/order-queue";
import { useState } from "react";

export function OrdersPanel({ canApprove }: { canApprove: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <OrderForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <OrderQueue canApprove={canApprove} refreshKey={refreshKey} />
    </>
  );
}
```

Create `apps/web/app/admin/orders/page.tsx` (server component):

```tsx
import { OrdersPanel } from "@/components/admin/orders-panel";
import { getServerSession } from "@/lib/session";

export default async function AdminOrdersPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <OrdersPanel canApprove={role === "superadmin"} />
    </div>
  );
}
```

- [ ] **Step 4: Admin nav**

Edit `apps/web/components/admin/nav.tsx`. Add two entries to the existing `LINKS` array:

```ts
const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/topup-requests", label: "Top-Up" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/transactions", label: "Transaksi" },
  { href: "/admin/settings", label: "Settings" },
];
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @invyte/web typecheck`

- [ ] **Step 6: Manual verification**

As `admin` (not `superadmin`): visit `/admin/orders`, confirm the create-order form works and Approve/Reject buttons are absent from the queue. As `superadmin`: confirm Approve/Reject appear and work, confirm "Buat Undangan" appears once an order is paid and redirects into the real editor with the submitted data pre-filled.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/admin/orders apps/web/components/admin/orders-panel.tsx \
  apps/web/components/admin/order-form.tsx apps/web/components/admin/order-queue.tsx \
  apps/web/components/admin/nav.tsx
git commit -m "feat(admin): add orders page — create order, approval queue, invitation handoff"
```

---

## Task 10: Full-stack verification pass

**Files:**
- No new files — verification only.

- [ ] **Step 1: Run the full test suite**

```bash
set -a && source .env && set +a
pnpm --filter @invyte/db test
pnpm --filter @invyte/web test
```
Expected: all existing tests (credit ledger, admin-permission regression) still pass — this plan didn't touch either subsystem, so a failure here means something in this plan broke unrelated code, not that new tests were expected.

- [ ] **Step 2: Full monorepo typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors across all packages.

- [ ] **Step 3: Biome check**

```bash
npx biome check apps/web/app/admin apps/web/app/order apps/web/app/api/v1/admin \
  apps/web/app/api/v1/orders apps/web/components/admin apps/web/components/orders \
  apps/web/lib/settings.ts packages/db/src/schema/settings.ts packages/db/src/schema/orders.ts
```
Expected: 0 errors (pre-existing warnings elsewhere in the repo are out of scope, per this project's established baseline from the prior plan).

- [ ] **Step 4: End-to-end manual walkthrough**

With the dev stack running: create an order as `admin`, open the public link as an anonymous browser session (different browser/incognito, to genuinely verify no auth leaks through), submit wedding data + photos + proof, approve as `superadmin`, create the invitation and confirm the submitted data is present, pick a template and publish, copy the public invitation link, confirm it opens with no login. Confirm `/admin` overview's revenue includes the order. Confirm a `GET /api/v1/orders/[token]` response (e.g. via curl) never includes `customerContact`.

- [ ] **Step 5: Report**

Summarize for the user: what was built (settings page + order intake flow), confirm all checks green, remind them the payment-placeholder text still needs real bank/QRIS details (now duplicated in two places — `topup-form.tsx` and `order-intake-form.tsx` — both need updating together), and flag the one deferred technical decision from Task 4 Step 2 (shared WA credential reuses the existing Cloud API env vars — confirm those are actually populated in production before relying on guest broadcast working for order tenants).
