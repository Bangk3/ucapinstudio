# Invyte (invyte)

Open-source, self-hosted SaaS for digital wedding invitations. Target market: Indonesia. License: AGPLv3 (core) + MIT (templates).

**Status:** MVP core built — M0–M4 (setup, auth/multi-tenancy, invitation editor + templates, guests/RSVP, public invitation polish) are done. M5 (Docker self-host packaging) and Phase 2 milestones (M6–M11) are in progress or pending. See `todo.md` for the live milestone table.

---

## Source Docs

- `PRD.md` — Product requirements, features, personas, success metrics
- `ARCHITECTURE.md` — System design, tech stack, deployment topologies
- `SCHEMA.md` — Full PostgreSQL schema (all tables, enums, indexes)
- `todo.md` — 11-milestone roadmap (~22 weeks)
- `lessons.md` — Anti-patterns to avoid, captured learnings

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router) — SSR for public pages, RSC for dashboards
- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS 4** + **shadcn/ui**
- **Framer Motion** — template animations
- **Zustand** — client state; **next-intl** — i18n; **Tiptap** — rich text

### Backend & Data
- **PostgreSQL 16** — UUID v7 PKs, TIMESTAMPTZ, soft delete, RLS, JSONB
- **Drizzle ORM** — type-safe, no codegen
- **Redis 7** — sessions, rate limiting, queue
- **BullMQ** — async jobs (AI gen, messaging)
- **MinIO** — default S3-compatible self-hosted storage
- **Better Auth** — multi-tenant JWT (httpOnly cookies, refresh rotation)

### AI
- **Claude Haiku** — text generation (< $0.10/gen budget)
- **Flux Schnell (fal.ai)** — image ornament generation
- **Claude Sonnet** — vision QA

### Infrastructure
- **Docker Compose** — production one-liner deployment
- **Caddy** — reverse proxy + auto-TLS
- **Turborepo + pnpm** — monorepo
- **Biome** — lint/format (replaces ESLint + Prettier)
- **GitHub Actions** — lint, typecheck, test, Docker build

---

## Architecture

### Multi-Tenancy
Path-based routing (`/[tenant]/...`), shared DB with RLS. Middleware extracts tenant from URL → validates (Redis-cached) → injects `x-tenant-id`.

**Tenant types:**
- `personal` — auto slug `user-{nanoid}`, 3 invitation limit
- `organization` — user-chosen slug, unlimited
- `system` — reserved for templates/admin

**Authorization (app-level + RLS defense-in-depth):**
| Action | Anon | Auth | Member | Owner |
|---|---|---|---|---|
| View published invitation | ✅ | ✅ | ✅ | ✅ |
| Submit RSVP | ✅ | ✅ | ✅ | ✅ |
| Create invitation | ❌ | ✅ | ✅ | ✅ |
| Edit invitation | ❌ | ❌ | ✅ | ✅ |
| Delete / manage settings | ❌ | ❌ | ❌ | ✅ |

### Adapter Pattern (pluggable backends)
All external integrations use adapters: Storage, Messaging, AI providers. Swap via env config with no code changes.

### Planned Monorepo Layout
```
apps/
  web/              — Next.js (dashboard + public pages + API)
  checkin-pwa/      — Offline QR scanner (Phase 2)
packages/
  db/               — Drizzle schema + migrations
  auth/             — Auth abstractions
  ui/               — Shared shadcn components
  templates/        — 5 invitation templates (React)
  messaging/        — Provider adapters (Cloud API, Fonnte, Wablas, SMTP)
  ai/               — AI generation (providers, generators, prompts)
  storage/          — S3/MinIO abstraction
  analytics/        — Self-hosted analytics
  i18n/             — Translation files (ID, EN, AR, JV, SU)
  shared/           — Types, utils, constants
plugins/
  baileys/          — WhatsApp Web (separate repo, with ToS disclaimer)
```

---

## Database Schema (Key Tables)

All tables: UUID v7 PK, `tenant_id` FK + RLS, soft delete via `deleted_at`.

| Table | Purpose |
|---|---|
| `users` | Auth accounts (email, OAuth, locale, timezone) |
| `tenants` | Workspaces (slug, type, plan, branding, limits JSON) |
| `memberships` | user↔tenant join (roles: owner/admin/editor/viewer) |
| `invitations` | Core invitation doc (status, kind, JSONB content, template, theme, settings) |
| `events` | Multi-event per invitation (akad, resepsi — date, location, livestream) |
| `guests` | Personalized guests (slug nanoid-8, category, plus-one, open tracking) |
| `rsvps` | Responses (yes/no/maybe, per invitation+guest+event, dedup) |
| `wishes` | Guest book (moderation: pending/approved/rejected/spam, spam score) |
| `checkins` | QR attendance (Phase 2) |
| `media` | File registry (S3 key, variants, dimensions) |
| `ai_generations` | AI job tracking (status, provider, cost in tokens+USD, QA score) |
| `view_events` | Raw analytics (bigserial, anonymized IP hash, GeoIP, device, referrer) |
| `analytics_daily` | Materialized aggregates per invitation per day |
| `messages` | Outbound messaging log (WA/SMS/email, status, provider, error) |
| `messaging_credentials` | Per-tenant provider config (AES-256-GCM encrypted) |
| `audit_logs` | Full audit trail (actor, action, resource, diff, IP) |

---

## Features

### MVP (P0)
- Email/password + Google OAuth, password reset, rate-limited login
- Multi-tenant path routing, personal vs org tenants
- Invitation CRUD with auto-save, 5 handcrafted templates
- Theme customizer (colors, fonts, photos) with real-time preview
- Multi-event support (akad, resepsi, etc.)
- Guest management: manual + CSV bulk import (10k rows)
- Personalized guest links (nanoid slug, open tracking)
- RSVP form + buku tamu (anti-spam, optional moderation)
- Countdown, Google Maps embed, share deeplinks, background music
- Docker Compose one-liner deployment + MinIO self-hosted storage

### Phase 2 (Differentiators)
- **Messaging:** WhatsApp Cloud API adapter (Fonnte/Wablas/SMTP fallbacks)
- **AI generation:** NL → template (Stage 1: constrained palette/copy/ornaments via Claude Haiku + Flux)
- **Digital amplop:** QRIS display, bank account info, e-wallet deeplinks
- **Analytics dashboard:** View funnel, RSVP breakdown, device/GeoIP
- **QR check-in:** Offline-first PWA scanner, real-time dashboard via SSE
- **i18n:** ID, EN, AR, JV, SU — RTL for Arabic, Hijri dates

---

## Implementation Roadmap

### MVP (~10 weeks → v0.1.0)
| M | Duration | Deliverable |
|---|---|---|
| M0 | 1w | Monorepo, CI/CD, docs |
| M1 | 2w | Auth + multi-tenancy |
| M2 | 3w | Invitation editor + 5 templates |
| M3 | 2w | Guests + RSVP + personalized links |
| M4 | 1w | Music, maps, countdown, share |
| M5 | 1w | Docker self-host + deployment docs |

### Phase 2 (~12 weeks → v0.2.0)
| M | Duration | Deliverable |
|---|---|---|
| M6 | 2w | Messaging adapter + Cloud API |
| M7 | 3w | AI template generation (Stage 1) |
| M8 | 1w | Digital amplop QRIS |
| M9 | 2w | Analytics dashboard |
| M10 | 2w | QR check-in PWA |
| M11 | 2w | Multi-language (5 locales) |

---

## Security

- JWT httpOnly cookies + refresh rotation + CSRF tokens
- Zod validation on all API endpoints
- File uploads: magic byte sniffing + UUID rename (never trust extension)
- Wishes HTML: DOMPurify whitelist
- RLS at DB level (defense-in-depth beyond middleware)
- Secrets via env vars only, never committed
- Soft delete with 30-day retention before hard delete

---

## Performance Targets

- Public invitation initial JS: < 100KB gzipped
- TTI on 3G: < 2.5s
- API p95 latency: < 300ms
- Concurrent users (single Docker host): 500+ view, 50+ edit
- AI generation: < 30s, < $0.10/gen

**Caching layers:** CDN (static, 1yr) → Next.js ISR (invitation pages) → Redis (tenant lookup, sessions, rate limits)

---

## Critical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tenancy model | Path-based | Simpler SSL, no wildcard DNS, easier local dev |
| SSR vs SSG | SSR + aggressive cache | Personalized per guest |
| Messaging | Adapter pattern, Baileys NOT bundled | ToS risk; plugins only with disclaimer |
| AI gen | Stage 1 constrained only | Deterministic output, faster MVP |
| Storage | MinIO default | True self-host, S3-compatible swappable |
| License | AGPLv3 + MIT templates | Prevent SaaS bypass; templates reusable |

---

## Anti-Patterns (from lessons.md)

- Don't mark milestones done without integration tests — unit tests can pass while user flows break
- Don't hardcode UI strings — use i18n keys from day 1
- Don't trust file extensions — magic byte sniff + re-encode on upload
- Don't put `tenant_id` filter only in middleware — DB-level RLS is mandatory
- Don't add third-party service without adapter + fallback
- Don't start AI tasks without per-tenant cost cap
- **Baileys** = legal landmine (Meta ML detection, ToS violation) — default to official Cloud API

---

## Non-Goals (Phase 1)

- Hosted SaaS by core team
- Native mobile apps (PWA sufficient)
- Paid template marketplace
- Full wedding planning suite (vendors, budget, tasks)
- Print-on-demand
- Payment processing (QRIS display only, no transaction handling)
