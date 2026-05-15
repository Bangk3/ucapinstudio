# Project Tasks: invyte

> Workflow: tick `[x]` when done. Each milestone has a verification gate before next starts.
> Lessons captured in `tasks/lessons.md`.

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
- [ ] Rate limiting on login (Redis-backed) — pending M3/M4

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
- [ ] Royalty-free music library (10 curated tracks in MinIO)
- [ ] Custom music upload (MP3, max 8MB, via storage package)
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
3. Rate limiting — not yet implemented on any public endpoints (RSVP, wishes); critical before M3 launch
4. RLS — DB-level row security is placeholder only; must implement before v0.1.0
5. Google OAuth — credentials stub done, needs real client ID/secret in env
