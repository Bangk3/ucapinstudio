# Architecture Document

**Project:** invyte
**Version:** 0.1
**Last updated:** 2026-05-12

---

## 1. Architecture Principles

1. **Self-host first** — Every architectural decision must support easy self-deployment. No cloud-only dependencies.
2. **Modular & pluggable** — Messaging, payment, storage, AI providers must be swappable.
3. **Multi-tenant by default** — Single user is just "tenant of one". No special-cases.
4. **Data ownership** — All data lives in user's database. Zero phone-home (telemetry opt-in only).
5. **Progressive enhancement** — Public invitation pages work without JS for accessibility.
6. **Boring tech** — Pick well-understood tools. Innovation budget on AI features, not infra.

---

## 2. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS                                  │
│  Mempelai (B2C)  •  WO/Reseller (B2B)  •  Tamu (Public)         │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           │ HTTPS                    │ HTTPS (public, no auth)
           ↓                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              CADDY / NGINX (Reverse Proxy + TLS)                │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────────┐
│                NEXT.JS APP (App Router)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │ Dashboard (Auth) │  │ Public Invite    │  │ API Routes   │   │
│  │ /:tenant/...     │  │ /:tenant/u/...   │  │ /api/...     │   │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘   │
│           └────────────┬────────┴────────────────────┘          │
│                        ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Service Layer (Domain Logic)                   │   │
│  │  invitations • guests • rsvp • analytics • ai • billing  │   │
│  └────────────┬─────────────────────────────────────────────┘   │
│               │                                                 │
│   ┌───────────┼──────────────┬──────────────┬─────────────┐     │
│   ↓           ↓              ↓              ↓             ↓     │
│  Drizzle    Storage      Messaging        AI         Queue      │
│   ORM       Adapter      Adapter         Adapter    (BullMQ)    │
└────┬──────────┬──────────────┬──────────────┬───────────┬───────┘
     │          │              │              │           │
     ↓          ↓              ↓              ↓           ↓
┌─────────┐ ┌────────┐ ┌────────────────┐ ┌────────┐ ┌──────────┐
│Postgres │ │ MinIO  │ │ Cloud API,     │ │Claude, │ │  Redis   │
│         │ │  / S3  │ │ Fonnte, Wablas,│ │ Flux,  │ │          │
│         │ │        │ │ SMTP, Baileys* │ │ etc.   │ │          │
└─────────┘ └────────┘ └────────────────┘ └────────┘ └──────────┘

* = optional plugin
```

---

## 3. Tech Stack Final

### 3.1 Application Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Runtime** | Node.js 22 LTS | Stable, well-supported, ecosystem |
| **Framework** | Next.js 15 (App Router) | SSR for public pages, RSC for dashboard |
| **Language** | TypeScript (strict) | Type safety, refactor confidence |
| **UI** | React 19 + Tailwind 4 | Industry standard, fast iteration |
| **Component lib** | shadcn/ui | Copy-paste, full control, no vendor lock |
| **Forms** | React Hook Form + Zod | Standard, validated schemas |
| **Animation** | Framer Motion | For template animations |
| **State** | Zustand (client) + RSC (server) | Minimal, no Redux complexity |
| **i18n** | next-intl | App Router native |
| **Editor** | Tiptap (rich text), shadcn (forms) | MVP doesn't need full visual builder |

### 3.2 Backend & Data

| Layer | Choice | Why |
|-------|--------|-----|
| **Database** | PostgreSQL 16 | RLS support, JSON, mature |
| **ORM** | Drizzle | Type-safe, no codegen pain, lightweight |
| **Cache** | Redis 7 | Sessions, queue, rate limiting |
| **Queue** | BullMQ (on Redis) | Battle-tested, good DX |
| **Search** | Postgres FTS (MVP), Meilisearch (later) | Avoid Elastic complexity |
| **Storage** | MinIO (default), S3-compatible | Self-host friendly |
| **Auth** | Better Auth | Modern, lightweight, multi-tenant ready |

### 3.3 AI & Integrations

| Use case | Default | Alternatives |
|----------|---------|--------------|
| Text gen (template copy) | Claude Haiku via API | OpenAI gpt-4o-mini, local Ollama |
| Image gen (ornaments) | Flux Schnell via fal.ai | Replicate SDXL, local SD |
| Image upscale | Real-ESRGAN | Replicate |
| Vision QA | Claude Sonnet | GPT-4o |

### 3.4 Infrastructure (Self-Host Default)

| Component | Tool |
|-----------|------|
| Reverse proxy | Caddy (auto-TLS) |
| Process manager | Docker Compose |
| Monitoring | OpenTelemetry → optional (Grafana stack) |
| Logs | stdout → Docker driver |
| Backups | pg_dump + MinIO mc, cron'd |

---

## 4. Multi-Tenant Architecture

### 4.1 Tenancy Model

**Path-based routing** with shared DB and row-level isolation.

```
/                       → Marketing site
/auth/login             → Auth
/:tenant/dashboard      → Tenant dashboard
/:tenant/u/:slug        → Public invitation
/:tenant/u/:slug/:guest → Personalized invitation
/api/v1/...             → API (tenant from JWT or header)
```

### 4.2 Tenant Extraction

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip system routes
  if (pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname === '/' ||
      pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Extract tenant slug (first path segment)
  const tenantSlug = pathname.split('/')[1];

  // Validate against DB (cached)
  const tenant = await tenantCache.get(tenantSlug);
  if (!tenant) return NextResponse.redirect('/404');

  // Inject tenant context via header
  const headers = new Headers(req.headers);
  headers.set('x-tenant-id', tenant.id);
  headers.set('x-tenant-slug', tenant.slug);

  return NextResponse.next({ headers });
}
```

### 4.3 Row-Level Security

**Approach:** Application-level enforcement via Drizzle helper.

```typescript
// db/with-tenant.ts
export function withTenant<T>(db: Database, tenantId: string) {
  return new Proxy(db, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== 'function') return original;
      return (...args: any[]) => {
        const result = original.apply(target, args);
        // Auto-inject tenant_id filter for SELECT, default for INSERT
        return injectTenantFilter(result, tenantId);
      };
    }
  });
}
```

**Defense in depth:** Also enable Postgres RLS as fallback.

```sql
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invitations
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### 4.4 Tenant Types

| Type | Slug | Limits | Use Case |
|------|------|--------|----------|
| **personal** | Auto-generated (`user-{nanoid}`) | 3 invitations | B2C single user |
| **organization** | User-chosen | Unlimited (config) | WO, reseller, agency |
| **system** | `system` | - | Reserved for templates, admin |

---

## 5. Data Flow Diagrams

### 5.1 Invitation Creation Flow

```
User                Dashboard         API            DB            Storage
  │                     │              │             │                │
  │ 1. Open editor      │              │             │                │
  ├────────────────────>│              │             │                │
  │                     │ 2. GET /api/invitations    │                │
  │                     ├─────────────>│             │                │
  │                     │              │ Query       │                │
  │                     │              ├────────────>│                │
  │                     │              │<────────────┤                │
  │                     │<─────────────┤             │                │
  │ 3. Edit & save      │              │             │                │
  ├────────────────────>│ 4. PATCH /api/invitations/:id              │
  │                     ├─────────────>│             │                │
  │                     │              │ 5. Update   │                │
  │                     │              ├────────────>│                │
  │                     │              │             │                │
  │ 6. Upload photo     │              │             │                │
  ├──────────────────────────────────────────────────────────────────>│
  │                     │              │             │  7. Resize+WebP│
  │                     │              │             │<───────────────┤
  │                     │              │ 8. Update photo URL          │
  │                     │              ├────────────>│                │
  │ 9. Publish          │              │             │                │
  ├────────────────────>│ 10. POST /api/invitations/:id/publish      │
  │                     ├─────────────>│             │                │
  │                     │              │ 11. Set status=published     │
  │                     │              ├────────────>│                │
  │<────────────────────┤<─────────────┤             │                │
  │   Public URL ready                                                │
```

### 5.2 Guest Visit & RSVP Flow

```
Tamu                Public Page      API            DB           Webhook
  │                     │              │             │              │
  │ 1. Buka link        │              │             │              │
  ├────────────────────>│              │             │              │
  │                     │ 2. SSR fetch │             │              │
  │                     ├─────────────>│             │              │
  │                     │              │ 3. Query    │              │
  │                     │              │  + track    │              │
  │                     │              ├────────────>│              │
  │                     │              │<────────────┤              │
  │                     │<─────────────┤             │              │
  │<────────────────────┤              │             │              │
  │ HTML render         │              │             │              │
  │                     │              │             │              │
  │ 4. Submit RSVP      │              │             │              │
  ├────────────────────>│ 5. POST /api/rsvp          │              │
  │                     ├─────────────>│             │              │
  │                     │              │ 6. Insert   │              │
  │                     │              ├────────────>│              │
  │                     │              │ 7. Trigger webhook         │
  │                     │              ├──────────────────────────> │
  │<────────────────────┤<─────────────┤             │              │
```

### 5.3 AI Template Generation Flow

```
User           Dashboard      Queue        Worker      LLM API     DB
  │                │            │            │           │           │
  │ 1. Prompt      │            │            │           │           │
  ├───────────────>│            │            │           │           │
  │                │ 2. POST /api/ai/generate│           │           │
  │                ├──────────> │            │           │           │
  │                │ 3. JobID returned       │           │           │
  │                │<───────────│            │           │           │
  │<───────────────┤            │            │           │           │
  │ Show loading   │            │            │           │           │
  │                │            │ 4. Worker picks job    │           │
  │                │            │ ──────────>│           │           │
  │                │            │            │ 5. Generate copy/palette│
  │                │            │            ├──────────>│           │
  │                │            │            │<──────────│           │
  │                │            │            │ 6. Validate & QA      │
  │                │            │            │           │           │
  │                │            │            │ 7. Save template      │
  │                │            │            ├───────────────────────>│
  │                │            │ 8. SSE/poll notify    │           │
  │                │<───────────┴────────────│           │           │
  │ Show result    │            │            │           │           │
  │<───────────────┤            │            │           │           │
```

---

## 6. Module Structure (Monorepo)

```
invyte/
├── apps/
│   ├── web/                    # Next.js main app
│   │   ├── app/
│   │   │   ├── (marketing)/    # Public landing
│   │   │   ├── (auth)/         # Login, register
│   │   │   ├── [tenant]/       # Tenant-scoped routes
│   │   │   │   ├── dashboard/  # WO/user dashboard
│   │   │   │   └── u/[slug]/   # Public invitation
│   │   │   └── api/v1/         # REST API
│   │   ├── components/
│   │   ├── lib/
│   │   └── middleware.ts
│   └── checkin-pwa/            # Offline-first QR scanner (Phase 2)
├── packages/
│   ├── db/                     # Drizzle schema + migrations
│   ├── auth/                   # Auth abstractions
│   ├── ui/                     # Shared UI components
│   ├── templates/              # Invitation templates (React)
│   │   ├── minimalist-modern/
│   │   ├── floral-classic/
│   │   ├── islamic-elegant/
│   │   ├── tropical-bali/
│   │   └── royal-java/
│   ├── messaging/              # Provider adapter
│   │   ├── core/               # Interface + base
│   │   ├── cloud-api/          # Meta Cloud API
│   │   ├── fonnte/
│   │   ├── wablas/
│   │   └── smtp/
│   ├── ai/                     # AI generation logic
│   │   ├── providers/          # Anthropic, OpenAI
│   │   ├── generators/         # template-gen, copy-gen
│   │   └── prompts/            # Versioned prompt templates
│   ├── storage/                # S3/MinIO abstraction
│   ├── analytics/              # Self-hosted analytics
│   ├── i18n/                   # Translation files
│   └── shared/                 # Types, utils, constants
├── plugins/                    # Optional, separate distribution
│   └── baileys/                # WhatsApp Web (with ToS warning)
├── docker/
│   ├── docker-compose.yml      # Production
│   ├── docker-compose.dev.yml  # Development
│   └── Dockerfile
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── SCHEMA.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
└── tasks/
    ├── todo.md
    └── lessons.md
```

---

## 7. Critical Architectural Decisions

### ADR-001: Path-based vs Subdomain Multi-Tenancy
**Decision:** Path-based (`/tenant/...`)
**Rationale:** Simpler SSL (single cert), easier local dev, no wildcard DNS needed. Subdomain custom can be added as premium Phase 2 feature.

### ADR-002: Monorepo vs Multi-repo
**Decision:** Monorepo (Turborepo)
**Rationale:** Shared types across packages, atomic changes, easier contribution onboarding.

### ADR-003: SSR vs SSG for Invitations
**Decision:** SSR with aggressive caching
**Rationale:**
- Personalized per guest → SSG impractical
- Cache key = `invitation_id + guest_slug`, invalidate on edit
- ISR for public preview pages

### ADR-004: Messaging — Adapter Pattern
**Decision:** Provider-agnostic interface, Baileys NOT bundled
**Rationale:** Legal/ToS protection for users, future-proof.

### ADR-005: AI Generation Approach
**Decision:** Stage 1 (constrained generation) for MVP, Stage 2+ post-validation
**Rationale:** Manage scope, deterministic output, faster iteration. Full layout-gen risks unreliable UX at launch.

### ADR-006: Storage — MinIO Default
**Decision:** MinIO bundled in docker-compose, S3-compatible interface
**Rationale:** True self-host without cloud dependency, can swap to R2/S3 via config.

### ADR-007: License
**Decision (proposed):** AGPLv3 for core, MIT for templates & plugins
**Rationale:** Prevent commercial SaaS bypass while keeping templates reusable.

---

## 8. Security Architecture

### 8.1 Auth Flow
- Session token (JWT) in httpOnly cookie
- Refresh token rotation
- CSRF token for state-changing requests
- Rate limiting at edge (Caddy) + app (Redis)

### 8.2 Authorization Matrix

| Action | Anonymous | Authenticated | Tenant Member | Tenant Owner |
|--------|-----------|---------------|---------------|--------------|
| View published invitation | ✅ | ✅ | ✅ | ✅ |
| Submit RSVP | ✅ | ✅ | ✅ | ✅ |
| Create invitation | ❌ | ✅ (own tenant) | ✅ | ✅ |
| Edit invitation | ❌ | ❌ | ✅ | ✅ |
| Delete invitation | ❌ | ❌ | ❌ | ✅ |
| Manage tenant settings | ❌ | ❌ | ❌ | ✅ |
| Manage members | ❌ | ❌ | ❌ | ✅ |

### 8.3 Input Validation
- All API inputs validated via Zod
- File uploads: type sniff via magic bytes, max size, rename to UUID
- HTML in ucapan: DOMPurify whitelist

### 8.4 Secrets Management
- All secrets via env vars
- `.env.example` documented, real `.env` in `.gitignore`
- Docker secrets support for production

---

## 9. Performance Strategy

### 9.1 Caching Layers
1. **CDN/Caddy:** Static assets (1 year), HTML (5 min stale-while-revalidate)
2. **Next.js:** `revalidate` on RSC, ISR for invitation pages
3. **Redis:** Tenant lookup, session, rate limit counters
4. **Postgres:** Pgbouncer connection pooling

### 9.2 Image Optimization
- Upload → Sharp resize → WebP + AVIF variants
- Stored at multiple sizes: 320, 640, 1080, 1920
- Lazy loading on public pages
- `<picture>` with srcset

### 9.3 Bundle Size Budget
- Initial JS for public invitation: < 100KB gzipped
- Code-split per template
- No analytics SDK on public pages (server-side only)

---

## 10. Observability

### 10.1 Logs
- Structured JSON via pino
- Levels: trace, debug, info, warn, error
- Sensitive fields auto-redacted

### 10.2 Metrics (Optional Telemetry, Opt-in)
- OpenTelemetry to user-configured endpoint
- Default: disabled
- Anonymized usage stats only (no PII)

### 10.3 Health Checks
- `/api/health` — DB, Redis, storage connectivity
- `/api/health/deep` — Run smoke test
- Docker `HEALTHCHECK` directives

---

## 11. Deployment Topologies

### 11.1 Minimal (Single VPS, Hobby)
```
Single $5-10 VPS (2GB RAM):
├── Caddy
├── Next.js (1 instance)
├── Postgres
├── Redis
└── MinIO (or external S3)

Target: < 100 concurrent users, < 50 active invitations
```

### 11.2 Production (Small Business / WO)
```
$30-50/month setup:
├── App server (4GB RAM, 2 cores) × 1-2
├── Managed Postgres (or dedicated 2GB)
├── Redis (1GB)
├── MinIO cluster or S3
└── Backup: pg_dump nightly to S3

Target: 1000+ concurrent users, unlimited invitations
```

### 11.3 Scale-out (Multi-tenant Reseller)
```
├── Load balancer (Caddy/Cloudflare)
├── App servers × 3+
├── Postgres primary + read replica
├── Redis cluster
├── MinIO distributed mode
└── Workers (BullMQ) × 2+

Target: 10k+ concurrent, AI generation queue, broadcast workers
```
