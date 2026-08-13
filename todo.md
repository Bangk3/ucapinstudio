# Project Tasks: invyte

> Workflow: tick `[x]` when done. Each milestone has a verification gate before next starts.
> Lessons captured in `lessons.md`.

---

## 📌 Session Log
 (newest first)

- **2026-08-13 — Premium template visual upgrade, Phase 3+4 (completes all 10 templates from the 2026-08-12 spec):** 3 new Sumatra-culture templates built from scratch — Aceh Heritage (Pinto Aceh gate motif, black-gold-red), Melayu Palembang (songket pucuk-rebung weave, gold-red-green), Lampung Tapis (Tapis chevron weave + Siger crown, maroon-gold) — plus 5 existing templates upgraded to the same ornament-foundation bar established by Phase 1+2's dark-luxury/floral-classic proof of concept: Batak Traditional, Minang Heritage, Royal Java, Islamic Elegant, Photo Editorial. Shared ornament library (`packages/templates/src/components/ornaments/`) extended with 5 new `CornerOrnament` culture variants and a new `CrownFlourish` component (direct response to a live indoinvite.com reference inspected via Playwright mid-session). All 8 templates got: PaperTexture, CornerOrnament hero flourishes, CrownFlourish above the couple names, PortraitFrame-based couple section, section `id`s, and QuickNav (never `!preview`-gated, per the Phase 1+2 adjudication). Executed via subagent-driven-development (9 tasks, 2-stage review each, opus final whole-branch review). Final review caught and fixed 2 real bugs: `islamic-elegant.tsx` missing `relative` wrapper (PaperTexture wasn't covering the page) and the 3 new templates being wired into the real registry but invisible on the public homepage's separate marketing `TEMPLATES` array (`apps/web/app/_home/index.tsx`) — both fixed pre-merge. 5 Minor findings deferred (registry copy promising unrendered silhouette details, royal-java ornament color not matching its own gold accent, `corner-ornament.tsx` lost exhaustiveness checking on the variant switch, 2 of 7 corner variants don't have the pathLength draw-in animation, dark-luxury/floral-classic still lack CrownFlourish since they predate it) — see plan `docs/superpowers/plans/2026-08-13-premium-template-visual-upgrade-phase3-4.md` for detail if picked up later. `TEMPLATES`/`TEMPLATE_COMPONENTS` now 25 entries. Merged to main (`0b4bc69..b91d4ca`), pushed. Same 6 pre-existing `DATABASE_URL`-required test failures as always (packages/db, unrelated to this work, sandbox has no `.env`).

> Cross-cutting work that doesn't map cleanly to one milestone checkbox below.
> Newest first. Read this before re-deriving project state from scratch.

- **Templates batch (M2 extension):** completed 5/5 remaining adat templates from `packages/templates/NEW_TEMPLATES_SPEC.md` — Minang Heritage (songket gold/maroon), Batak Traditional (ulos ragidup red/black/white), Betawi Modern (gigi balang red/gold), Bugis-Makassar Elegant (sarung tenun jewel tones), Arabic Calligraphy Luxe (emerald/gold, distinct from existing Islamic Elegant's navy/gold). All registered in `packages/templates/src/index.ts` + homepage `TEMPLATES` array (`apps/web/app/_home/index.tsx`). `pnpm --filter @invyte/templates typecheck`, `@invyte/web typecheck` and `@invyte/web lint` clean after each; `pnpm run build` passes. `@invyte/db` test suite fails only on missing `DATABASE_URL` env var (pre-existing infra blocker, unrelated to templates). Spec file deleted & committed.

> Cross-cutting work that doesn't map cleanly to one milestone checkbox below.
> Newest first. Read this before re-deriving project state from scratch.

### 2026-08-12 — Homepage polish + full security/perf/SEO pass
Commits `7911b2b`..`97d8dac` on `main` (all pushed).
- Rebranded template attribution badge + homepage footer: "DevLab.tgk" → "UcapinStudio" (not legally required, MIT templates + no additional-attribution clause in root LICENSE — only the AGPLv3 §13 "Source Code" link is mandatory and was left untouched).
- Homepage template row: replaced periodic smooth-scroll jumps with a continuous `requestAnimationFrame` crawl (`apps/web/app/_home/index.tsx`), pauses on hover/touch.
- Homepage template preview: real free-stock couple/cover/gallery photos (Unsplash/Pexels, individually license-verified) instead of placeholders.
- Preset background-music picker (4 self-hosted, license-verified royalty-free/public-domain tracks — see `apps/web/lib/preset-music.ts`) in the invitation editor, alongside existing upload/paste-link options. Homepage preview modal gets its own independent `<audio>` control for an example track — deliberately NOT wired through the templates' `!preview` gate (that gate also protects RSVP/Wishes from firing on the fake homepage tenant; touching it was out of scope).
- Fixed critical `better-auth` CVE (OAuth refresh-token replay, GHSA-pw9m-5jxm-xr6h) — bumped 1.2.7→1.6.26/27.
- Added magic-byte validation to `uploadAudio()` (`packages/storage/src/upload.ts`) — previously trusted client filename/MIME, unlike `uploadImage()` which already did this. Closes the gap against this repo's own "never trust extension" rule.
- Fixed a real bundle-bloat regression from this session's own earlier preview-modal work: homepage was eagerly bundling all 22 templates. Converted to `next/dynamic` in `apps/web/app/_home/index.tsx`.
- Added `robots.ts`, `sitemap.ts` (homepage only — tenant invitations deliberately excluded), `icon.tsx`, `opengraph-image.tsx`; added `robots: {index:false}` + `openGraph.images` to both public invitation page variants (personal wedding data was previously indexable by default — privacy fix).
- Swept the remaining 38 non-critical `pnpm audit` findings (3 low/17 moderate/18 high) down to **0**. Direct bumps: `next` 15.5.18→15.5.23, `drizzle-orm` 0.41.0→0.45.2 (SQL injection fix), `sharp` 0.34.5→0.35.3, `nodemailer` 6.10.1→9.0.1, `next-intl` 3.26.5→4.13.6, `turbo` 2.3.3→2.10.9. Transitive-only advisories (form-data, js-yaml, fast-uri, nanoid, esbuild, postcss) pinned via `pnpm-workspace.yaml` `overrides:`. Verified: clean audit, clean typecheck (8/8 packages), clean prod build.
- Login already had Redis rate-limiting pre-existing (`apps/web/app/api/auth/[...all]/route.ts`, 10/15min per IP hash) — checked, not new work.
- **Not done, not asked for:** the milestone checklists below (M5–M11) were not re-audited against actual code this session — the app already has working `/admin`, `/order`, `/checkin`, `/broadcast`, `/ai` routes that suggest M6–M10 are further along than their "—" status implies. Worth a dedicated reconciliation pass before trusting the table below at face value.

---

## 🎯 Milestone Overview

| # | Milestone | Duration | Status |
|---|-----------|----------|--------|
| M0 | Project setup & foundations | 1 week | ✅ Done |
| M1 | Auth & multi-tenancy core | 2 weeks | ✅ Done |
| M2 | Invitation editor & templates | 3 weeks | ✅ Done |
| M3 | Guest list & RSVP | 2 weeks | ✅ Done |
| M4 | Public invitation polish | 1 week | ✅ Done |
| M5 | Docker self-host packaging | 1 week | — |
| **🚀** | **MVP RELEASE** | **10 weeks total** | **v0.1.0** |
| M6 | Messaging adapter + Cloud API | 2 weeks | — |
| M7 | AI template generation (Stage 1) | 3 weeks | — |
| M8 | Digital amplop QRIS | 1 week | — |
| M9 | Analytics dashboard | 2 weeks | — |
| M10 | QR check-in PWA | 2 weeks | — |
| M11 | Multi-bahasa & regional | 2 weeks | — |
| **🎉** | **v0.2.0 — DIFFERENTIATOR RELEASE** | **+12 weeks** | — |
| MON-0 | Legal foundation (CLA, dual-license) | 1 week | — |
| MON-1 | Validate cashflow (AI credit + Sponsors + WA bundle) | 3 months | — |
| MON-2 | WO pre-sell + white-label pilot | 3 months | — |
| MON-3 | Lane decision: B2B scale OR B2C SaaS | 6+ months | — |
| **💰** | **MONETIZATION LIVE** | **+12 months** | — |

---

## M0 — Project Setup & Foundations ✅

### Tasks

#### Repository & Tooling
- [x] Init Turborepo monorepo with pnpm workspaces
- [x] Configure TypeScript root + per-package `tsconfig`
- [x] Setup Biome (formatter + linter)
- [x] Setup Husky + lint-staged for pre-commit
- [x] Configure `.editorconfig`, `.gitignore`, `.gitattributes`
- [ ] Setup commitlint with conventional commits
- [ ] Add `LICENSE` (AGPLv3 for core)
- [ ] Setup `CHANGELOG.md` with Changesets

#### Scaffolding
- [x] Create `apps/web` Next.js 15 app with TypeScript + Tailwind 4
- [x] Setup shadcn/ui base components
- [x] Create `packages/db` with Drizzle + Postgres setup
- [x] Create `packages/ui` for shared components
- [x] Create `packages/shared` for types & utils
- [x] Configure path aliases (`@invyte/db`, `@invyte/ui`, etc.)

#### Documentation
- [ ] Setup Nextra or Fumadocs at `apps/docs`
- [ ] Migrate PRD.md, ARCHITECTURE.md, SCHEMA.md to docs site
- [ ] Write `README.md` with quick start
- [ ] Write `CONTRIBUTING.md` with PR guidelines
- [ ] Write `CODE_OF_CONDUCT.md`

#### CI/CD
- [ ] GitHub Actions: lint, typecheck, test on PR
- [ ] GitHub Actions: build Docker image on main push
- [ ] Setup Dependabot for security updates
- [ ] Setup CodeQL scanning

#### Local Dev Environment
- [x] `docker-compose.dev.yml` with Postgres + Redis + MinIO
- [x] `pnpm dev` runs everything (db migrate + seed + app)
- [x] Seed script with example tenant + invitation
- [x] `.env.example` documented

---

## M1 — Auth & Multi-Tenancy ✅

### Tasks

#### Database
- [x] Implement `users` table + migration
- [x] Implement `tenants` table + migration
- [x] Implement `memberships` table + migration
- [x] Write seed data (1 admin user, 1 personal tenant, 1 org tenant)

#### Auth (Better Auth)
- [x] Setup Better Auth with Postgres adapter
- [x] Email + password registration with verification
- [x] Login + logout flow
- [x] Password reset via email (endpoint wired, no SMTP in dev)
- [ ] Google OAuth provider (config stub done, needs real credentials)
- [x] Session management + refresh token
- [x] Rate limiting on login (Redis-backed, 10 attempts/15min per IP hash)

#### Multi-Tenancy
- [x] Implement tenant slug validation
- [x] Auto-create personal tenant on user signup (via Better Auth databaseHooks)
- [ ] Tenant creation form (for org tenants)
- [x] Path-based tenant middleware (`/[tenant]/...`)
- [x] Tenant context provider (server-side via lib/tenant.ts)
- [ ] `withTenant(db)` Drizzle helper — placeholder only
- [ ] Enable Postgres RLS as defense-in-depth
- [ ] Integration tests: tenant A cannot read tenant B data

#### Dashboard Shell
- [x] Auth-gated layout for `/[tenant]/dashboard/*`
- [x] Sidebar navigation
- [ ] Tenant switcher UI
- [x] User profile dropdown (logout)

#### Tenant Settings
- [ ] Settings page: name, slug, timezone, locale
- [ ] Branding upload: logo, primary color
- [ ] Member management (invite by email, role assignment)

---

## M2 — Invitation Editor & Templates ✅

### Tasks

#### Database
- [x] `invitations` table + migration
- [x] `events` table + migration (included in initial migration)
- [x] `media` table + migration

#### Storage
- [x] MinIO bucket setup + public read policy
- [x] `packages/storage` with S3Client (forcePathStyle for MinIO)
- [x] Image upload with Sharp: WebP variants (320/640/1080/1920)
- [x] Magic byte type detection (JPEG/PNG/WebP/GIF)
- [x] Audio upload (MP3/OGG, 8MB max)
- [ ] Signed URL generator for private media — getSignedDownloadUrl implemented, not yet used
- [ ] Invitation photo upload UI (cover photo, couple photos, gallery)

#### Templates Package
- [x] Define template interface (`TemplateProps`, `InvitationData`, `ThemeConfig`, etc.)
- [x] Create `packages/templates` with registry (`TEMPLATES`, `TEMPLATE_COMPONENTS`, `getTemplate()`)
- [x] **Template 1: Minimalist Modern** (sage green #6b8f6e)
- [x] **Template 2: Floral Classic** (cream #f5ede8 + rose #c4826a)
- [x] **Template 3: Islamic Elegant** (dark navy + gold #c9a84c + Bismillah + QS Ar-Rum:21)
- [x] **Template 4: Tropical Bali** (palm green #2d6a4f + terracotta #c87941)
- [x] **Template 5: Royal Java** (maroon #8b1a2e + gold #c9a84c + batik borders)
- [ ] Template preview screenshots auto-generated

#### Invitation API
- [x] `POST /api/v1/invitations` — create with auto-slug
- [x] `GET /api/v1/invitations` — list by tenantSlug
- [x] `GET /api/v1/invitations/:id` — read
- [x] `PATCH /api/v1/invitations/:id` — update (content/theme/template/settings)
- [x] `DELETE /api/v1/invitations/:id` — soft delete
- [x] `POST /api/v1/invitations/:id/publish` — toggle published ↔ draft
- [x] `POST /api/v1/invitations/:id/duplicate` — copy with `-copy` slug
- [x] Zod validation on all endpoints
- [x] Auto-save debounce 1200ms

#### Invitation Editor UI
- [x] Create invitation wizard (kind, name, template picker)
- [x] Editor layout: left panel tabs + right scaled preview (60%)
- [x] **Section: Mempelai** (groom/bride name, full name, parents)
- [x] **Section: Acara** (multi-event accordion: name, date, time, venue, maps, dresscode)
- [x] **Section: Kisah** (story textarea, music URL, gallery URL list)
- [x] **Section: Tema** (template switcher + primary/accent color pickers + cover photo URL)
- [x] **Section: Pengaturan** (RSVP toggle, wishes toggle, moderation, link copy, duplicate, delete)
- [x] Save status indicator (idle / saving / saved / error)
- [x] Publish/unpublish button
- [ ] Live preview: mobile/desktop toggle
- [ ] Photo upload (currently URL input only)

#### Public Invitation Page
- [x] Route `/[tenant]/u/[slug]` with SSR
- [x] Template rendering with theme injection
- [x] OG meta tags (title, description, openGraph)
- [x] JSON-LD structured data (Event schema)
- [x] `?tamu=NamaOrang` for personalized guest name
- [x] 404 for drafts/archived
- [ ] Mobile-first responsive verification
- [ ] Lighthouse score > 90 on default template

#### Dashboard
- [x] Invitations list page with status badges + empty state
- [x] Dashboard home updated: real invitation counts, recent list

### Verification Gate
- [ ] Manual: create invitation, customize, publish, view public URL
- [ ] Test: all 5 templates render without error
- [ ] Lighthouse audit passes on each template
- [ ] Open Graph preview works on WhatsApp + Telegram

---

## M3 — Guest List & RSVP ✅

### Goal
User can manage guest list, bulk import via CSV, generate personalized links, receive RSVP + wishes.

### Tasks

#### Database
- [x] `guests` table — already in schema, needs migration verify
- [x] `rsvps` table — already in schema
- [x] `wishes` table — already in schema
- [x] Verify indexes on all three tables

#### Guest Management API
- [x] `GET /api/v1/invitations/:id/guests` — list (paginated, search, filter)
- [x] `POST /api/v1/invitations/:id/guests` — add single
- [x] `PATCH /api/v1/invitations/:id/guests/:guestId`
- [x] `DELETE /api/v1/invitations/:id/guests/:guestId`
- [ ] `POST /api/v1/invitations/:id/guests/bulk` — bulk operations
- [x] `POST /api/v1/invitations/:id/guests/import` — CSV streaming parse
- [x] `GET /api/v1/invitations/:id/guests/export` — CSV download
- [ ] CSV template download endpoint
- [ ] Phone normalization (E.164, default +62)

#### Guest UI
- [x] Guest list table (sort, filter, search)
- [x] Add guest form (manual)
- [x] Bulk CSV upload with progress indicator
- [x] CSV validation + error report display
- [x] Edit/delete row actions
- [ ] Bulk select + bulk delete
- [x] Copy personalized link per row
- [x] Export to CSV button

#### Personalized Links
- [x] Route `/[tenant]/u/[slug]/[guestSlug]` — guest-specific public page
- [x] Inject guest name from DB (not just ?tamu= query param)
- [x] Track opens: increment `open_count`, set `opened_at`
- [ ] QR code generation per guest (download ZIP)

#### RSVP
- [x] RSVP form embedded in all 5 templates (conditional on `rsvpEnabled`)
- [x] `POST /api/v1/rsvps` — public, IP-hash rate limit via DB
- [x] Duplicate RSVP prevention (unique guestId + eventId upsert)
- [x] Success confirmation UI in template
- [ ] RSVP summary in dashboard (yes/no/maybe counts per event)
- [ ] RSVP detail table + CSV export

#### Wishes (Buku Tamu)
- [x] Wishes form in templates (conditional on `wishesEnabled`)
- [x] `POST /api/v1/wishes` — public, DB-based rate limit (5/IP/hour)
- [x] `GET /api/v1/wishes` — public paginated feed
- [x] Spam detection (rate + length scoring)
- [x] Moderation queue if `wishesModerated=true`
- [x] Auto-approve if not moderated
- [x] Moderation UI in dashboard

### Verification Gate
- [x] Manual: import CSV, send personalized links, submit RSVPs — verified
- [ ] Rate limiting works (429 after threshold) — DB-based, not Redis yet
- [ ] Duplicate RSVP rejected (409) — upsert instead (200 on repeat)
- [ ] Performance: 1000-guest CSV import < 30s

---

## M4 — Public Invitation Polish (Week 9) ✅

- [x] Countdown timer component (per event, client-side) — live seconds
- [ ] Google Maps embed component + OpenStreetMap fallback
- [x] Add-to-calendar buttons (Google Calendar + Apple/Outlook .ics)
- [x] Waze + Google Maps deeplinks (lat/lng required for Waze)
- [x] Background music player (autoplay muted → tap to unmute)
- [x] Royalty-free music library (4 curated tracks, self-hosted MP3s — not MinIO, not 10; see `apps/web/lib/preset-music.ts`)
- [x] Custom music upload (MP3, via storage package + magic-byte validation) + paste-link option
- [x] Share button group (WA, Telegram, copy link)
- [ ] Gallery lightbox + swipe (mobile)
- [ ] Love story timeline component
- [x] Opening animation / "buka undangan" intro screen — all 5 templates
- [ ] Photo upload in editor (connect storage package to UI)

---

## M5 — Docker Self-Host (Week 10)

#### Docker
- [ ] Production Dockerfile (multi-stage, < 200MB)
- [ ] `docker-compose.yml` for production (app + postgres + redis + minio + caddy)
- [ ] Caddy config with auto-TLS
- [ ] Volume mounts for persistent data
- [ ] Health checks for all services
- [ ] Resource limits (memory, CPU)

#### First-Run Experience
- [ ] First-visit setup wizard
- [ ] Create admin user during setup
- [ ] Auto-generate secure secrets
- [ ] Smoke test endpoint

#### Operational
- [ ] Database backup script (pg_dump nightly)
- [ ] MinIO backup with `mc mirror`
- [ ] Upgrade migration runner

#### Documentation
- [ ] `DEPLOYMENT.md` — full self-host guide
- [ ] VPS sizing recommendations
- [ ] Backup & restore guide
- [ ] Upgrade guide
- [ ] Troubleshooting FAQ

### 🚀 MVP Release Gate
- [ ] Deploy from scratch on $5 VPS in < 10 min
- [ ] Full end-to-end E2E test as new user
- [ ] Load test: 100 concurrent public views
- [ ] Security audit: OWASP checklist
- [ ] **Tag v0.1.0**

---

## M6 — Messaging Adapter (Weeks 11-12)

- [ ] `packages/messaging` with `MessagingProvider` interface
- [ ] WhatsApp Cloud API adapter (Meta official)
- [ ] Fonnte adapter (Indonesia)
- [ ] Wablas adapter (Indonesia)
- [ ] SMTP adapter (email fallback)
- [ ] `messages` + `messaging_credentials` tables + encryption
- [ ] Broadcast UI: pick guests → preview → send
- [ ] Delivery status tracking via webhook
- [ ] `invyte-baileys` as separate repo with ToS disclaimer

---

## M7 — AI Generation Stage 1 (Weeks 13-15)

- [ ] `packages/ai` with Anthropic + OpenAI-compatible adapters
- [ ] Gemini support via OpenAI-compatible endpoint or native SDK
- [ ] Prompt versioning + structured JSON output
- [ ] Generate: color palette (WCAG AA validated) + font pairing + copy + ornaments
- [ ] `ai_generations` table + BullMQ worker
- [ ] Per-tenant cost cap enforcement
- [ ] Auto-QA via vision model screenshot + score
- [ ] Generation wizard UI (3 variants, select + apply, iterate)

---

## M8 — Digital Amplop QRIS (Week 16)

- [ ] QRIS upload + CRC validation
- [ ] Bank account fields (multi-bank)
- [ ] E-wallet fields (GoPay/OVO/Dana/ShopeePay)
- [ ] Public component with tabs + deeplinks

---

## M9 — Analytics Dashboard (Weeks 17-18)

- [ ] `view_events` + `analytics_daily` tables
- [ ] Server-side tracking middleware (IP hash, GeoIP, UA parse)
- [ ] Daily aggregation cron
- [ ] Dashboard widgets: views, funnel, device, geo, referrer, heatmap
- [ ] Export CSV/PDF

---

## M10 — QR Check-in PWA (Weeks 19-20)

- [ ] `apps/checkin-pwa` offline-first
- [ ] jsQR scanner + camera access
- [ ] IndexedDB sync
- [ ] `checkins` table + SSE real-time dashboard

---

## M11 — Multi-Bahasa & Regional (Weeks 21-22)

- [ ] next-intl with ID, EN, AR, JV, SU
- [ ] RTL layout for Arabic templates
- [ ] Hijri date support
- [ ] Dashboard translated (ID + EN minimum)

---

## 💰 Monetization Roadmap

> **Strategy:** open-source freemium → paid kuota → B2B white-label.
> **Constraint:** AGPLv3 core, no in-house payment processing, no listing fees in Phase 1.
> **Principle:** validate willingness-to-pay before building infra. Pre-sell > pre-build.

### Skip List (Permanent / Phase 3+ Re-eval)

- ❌ **Print-on-demand** — logistik trap, complaint vortex
- ❌ **Gift registry affiliate** (Tokopedia/Shopee wishlist) — Indonesia amplop culture, conversion ~0%
- ❌ **In-house payment processing** — non-goal per PRD, regulatory + fraud risk
- ⏸️ **Vendor marketplace** — re-eval at month 12, needs network effect
- ⏸️ **Premium template pack** — re-eval at month 12, needs designer pipeline
- ⚠️ **Baileys bundling** — legal landmine, plugin-only with disclaimer

---

### MON-0 — Legal Foundation (Week 23)

> Must complete BEFORE accepting any external contribution or paying customer.

#### License & Contributor Agreement
- [ ] Add `LICENSE` at repo root (AGPLv3 full text)
- [ ] Add `LICENSE-templates` for `/packages/templates` (MIT)
- [ ] Draft `CLA.md` (individual + corporate variants)
- [ ] Setup CLA Assistant bot on GitHub PRs
- [ ] Draft `COMMERCIAL-LICENSE.md` template (for white-label buyers)
- [ ] Trademark check on "Invyte" name (DJKI Indonesia)

#### Business Entity
- [ ] Decide entity form (PT Perorangan / CV / sole prop)
- [ ] NPWP setup
- [ ] Open business bank account (BCA/Mandiri)

---

### MON-1 — Validate Cashflow (Months 1-3 post-MVP)

> Goal: prove paying users exist. Target Rp 500k/bulan MRR by end of month 3.

#### AI Credit Top-Up
- [ ] Add `credit_balance` column to `tenants` table
- [ ] Add `credit_transactions` table (debit/credit ledger)
- [ ] Wire AI generation endpoint to debit credits (cost = Rp 5k/gen)
- [ ] UI: balance widget in dashboard header
- [ ] UI: top-up modal (Rp 25k / 100k / 500k packs)
- [ ] Payment redirect to Midtrans/Xendit (NOT in-house — they handle PCI)
- [ ] Webhook handler for payment success → credit grant
- [ ] Receipt email via SMTP adapter

#### GitHub Sponsors / OpenCollective
- [ ] Setup GitHub Sponsors profile
- [ ] Add `FUNDING.yml` to repo
- [ ] Add sponsor tiers ($5 / $25 / $100 / $500 / month)
- [ ] Add sponsor logo block to README + homepage footer

#### WhatsApp Bundle Positioning
- [ ] Reposition WA credit: NOT standalone, only as "Paket Event Premium"
- [ ] Bundle SKU: Rp 199k/event = 1000 WA msg + 10 AI gen + custom subdomain
- [ ] UI: package selector in dashboard
- [ ] Wholesale negotiate Fonnte/Wablas/Cloud API rate (>15% margin)

#### Metrics
- [ ] Setup analytics: signups, paid conversions, MRR, churn
- [ ] Weekly report cron → email to founder
- [ ] Definition of success: ≥ 10 paying tenants by end of month 3

---

### MON-2 — WO Pre-Sell + White-Label Pilot (Months 4-6)

> Goal: 2-3 WO paying customers, signed contracts. NOT mass market.

#### Pre-Sell Phase (Month 4)
- [ ] Build sales deck (10 slides: problem, demo, pricing, ROI)
- [ ] Build demo environment with sample WO branding
- [ ] List 20 target WO (Jakarta/Bandung/Surabaya tier)
- [ ] Cold outreach via Instagram DM + LinkedIn
- [ ] Pricing: Rp 2.5jt/tahun base + Rp 500k setup
- [ ] **GATE: ≥ 1 signed LOI before building white-label features**

#### White-Label Features (Month 5-6, only if Pre-Sell gate passes)
- [ ] Custom subdomain per tenant (e.g. `weddingco.invyte.io`)
- [ ] Hide "Powered by Invyte" footer (configurable)
- [ ] Custom logo + favicon per tenant
- [ ] Custom email sender domain (DKIM setup helper)
- [ ] Branded email templates
- [ ] Per-tenant terms-of-service + privacy policy hosting
- [ ] Multi-event template lock (WO can lock 1 template to all clients)

#### Onboarding & Support
- [ ] White-label tenant onboarding checklist
- [ ] Dedicated Slack/Discord channel per WO partner
- [ ] SLA document (response time, uptime guarantee)
- [ ] Quarterly business review template

#### Metrics
- [ ] Track: deals closed, ACV, churn, NPS per WO
- [ ] Definition of success: ≥ 3 paying WO by end of month 6

---

### MON-3 — Lane Decision (Months 7-12)

> At month 6 checkpoint, choose ONE lane based on data. Do NOT pursue both.

#### Decision Matrix (evaluate at month 6)

| Signal | Lane A (B2B) | Lane B (B2C) |
|---|---|---|
| MON-2 WO closing rate ≥ 30% | ✅ | ❌ |
| MON-1 individual user MRR ≥ Rp 5jt | ❌ | ✅ |
| Founder has sales/BD bandwidth | ✅ | ❌ |
| Founder prefers product/UX work | ❌ | ✅ |

#### Lane A — B2B Scale (if WO pilot succeeds)
- [ ] Hire 1 part-time sales (commission-based)
- [ ] Build WO admin dashboard (manage multi-tenant)
- [ ] WO affiliate program (20% commission for referring new WO)
- [ ] Vendor marketplace v1 (MUA/foto/katering) — referral fee model only
- [ ] Verified Vendor Badge (Rp 1jt/year, manual QC)
- [ ] Annual contract upgrades (Pro Rp 5jt, Enterprise Rp 15jt)
- [ ] **Target: 20 WO × Rp 3jt avg = Rp 60jt ARR**

#### Lane B — B2C Managed Cloud (if individual demand stronger)
- [ ] Provision multi-tenant SaaS infra (k8s or single-node Docker)
- [ ] Hosted at `invyte.id` with subdomain per tenant
- [ ] Pricing tiers: Free (3 invitations) / Pro Rp 99k/event / Lifetime Rp 299k
- [ ] Custom domain feature (Rp 50k setup + DNS proxy)
- [ ] Photo hosting tier (500MB free, 5GB Rp 50k/event)
- [ ] Auto-scaling for traffic spikes (wedding season peaks)
- [ ] CS chat widget (Tawk.to or Crisp free tier)
- [ ] **Target: 200 events/bulan × Rp 99k = Rp 19.8jt/bulan MRR**

#### Universal (both lanes)
- [ ] Quarterly financial review
- [ ] Update PRD with monetization features as P1
- [ ] Tax compliance (PPN 11% if revenue > Rp 4.8M/year)

---

### 💰 Monetization Release Gate
- [ ] MON-0: legal docs published, CLA enforced
- [ ] MON-1: ≥ Rp 500k MRR sustained for 2 months
- [ ] MON-2: ≥ 3 paying WO contracts (Lane A) OR ≥ 50 paying individuals (Lane B precursor)
- [ ] MON-3 lane selected based on data, not gut
- [ ] **Tag v1.0.0 (post-monetization)**

---

## 📝 Review Section

### Key Decisions Made
- Better Auth `databaseHooks.user.create.after` for auto tenant creation
- `exactOptionalPropertyTypes: true` enforced — use spread pattern `...(x !== undefined ? { x } : {})` for optional props
- Templates use inline Tailwind + inline styles (no CSS modules) for portability
- Storage package uses `forcePathStyle: true` for MinIO compatibility
- Forgot-password uses direct fetch to `/api/auth/forget-password` (Better Auth client doesn't expose method without plugin config)
- uuidv7 implemented inline in API routes (no lib dep needed)

### Open Risks
1. Photo upload in editor — currently URL-only; need to wire `packages/storage` upload to editor UI in M4
2. AI generation quality — validate early with M7 prototype before committing timeline
3. ~~Rate limiting — not yet implemented~~ — RESOLVED: Redis-backed `rateLimitIp()`/`rateLimit()` (`apps/web/lib/rate-limit.ts`) now covers login, RSVP, wishes, and orders endpoints (verified 2026-08-12)
4. RLS — DB-level row security is placeholder only; must implement before v0.1.0
5. Google OAuth — credentials stub done, needs real client ID/secret in env

### Monetization Risks
6. **CLA must be in place BEFORE first external PR merged** — retroactive CLA is legal nightmare
7. **Dual-license positioning** — AGPLv3 + Commercial license requires single copyright holder (no co-owned IP)
8. **WO pre-sell gate (MON-2)** — do NOT build white-label features until ≥1 signed LOI; sunk-cost trap
9. **Payment processor selection** — Midtrans vs Xendit, KYC takes 2-4 weeks; start early in MON-1
10. **WA wholesale rate** — Fonnte retail margin is 10-15% only; must negotiate wholesale tier or skip standalone WA pricing
11. **Lane decision discipline** — pursuing both B2B + B2C at month 7 = founder burnout, pick ONE
12. **Tax compliance trigger** — PPN at Rp 4.8M/year revenue; setup NPWP business before MON-1 launch
