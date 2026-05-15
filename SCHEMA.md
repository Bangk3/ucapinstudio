# Database Schema

**Project:** invyte
**Version:** 0.1
**Last updated:** 2026-05-12
**DBMS:** PostgreSQL 16+

---

## 1. Overview

Multi-tenant schema with row-level isolation via `tenant_id` foreign key. All tenant-scoped tables enforce isolation at both application and database (RLS) layers.

### Naming Conventions
- Tables: `snake_case`, plural (`invitations`, not `invitation`)
- Columns: `snake_case` (`created_at`, `tenant_id`)
- Primary keys: `id` (UUID v7 for time-ordered)
- Foreign keys: `{table_singular}_id` (`tenant_id`, `invitation_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft delete)
- Booleans: `is_*` or `has_*` prefix

### Common Patterns
- UUID v7 for primary keys (sortable, no enumeration attack)
- Timestamps with timezone (`TIMESTAMPTZ`)
- Soft delete via `deleted_at IS NOT NULL`
- Audit fields: `created_by`, `updated_by`

---

## 2. Entity Relationship Overview

```
                    ┌──────────┐
                    │  users   │
                    └────┬─────┘
                         │
                         │ M:N (via memberships)
                         ↓
┌─────────────────┐ 1:N ┌──────────┐
│ subscriptions   │<────│ tenants  │
└─────────────────┘     └────┬─────┘
                             │ 1:N
                             ↓
                       ┌─────────────┐    1:N    ┌─────────┐
                       │ invitations │──────────>│ events  │
                       └──┬──────────┘           └─────────┘
                          │ 1:N
                          ↓
                  ┌─────────────┐         1:N    ┌──────────┐
                  │   guests    │───────────────>│ rsvps    │
                  └─────────────┘                └──────────┘
                          │
                          │ 1:N
                          ↓
                  ┌─────────────┐
                  │ checkins    │
                  └─────────────┘

  ┌──────────┐    ┌─────────┐    ┌────────────┐
  │ themes   │    │ media   │    │ wishes     │
  └──────────┘    └─────────┘    └────────────┘
  (per invitation)                (RSVP messages)
```

---

## 3. Core Tables

### 3.1 `users` — Account holders

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  email           CITEXT UNIQUE NOT NULL,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash   TEXT,                    -- NULL for OAuth-only
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  locale          TEXT NOT NULL DEFAULT 'id',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  oauth_providers JSONB DEFAULT '[]'::jsonb,
                  -- [{provider:'google', sub:'...', linked_at:'...'}]
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_oauth ON users USING GIN(oauth_providers);
```

### 3.2 `tenants` — Workspaces

```sql
CREATE TYPE tenant_type AS ENUM ('personal', 'organization', 'system');
CREATE TYPE tenant_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  slug            TEXT UNIQUE NOT NULL
                  CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,49}$'),
  name            TEXT NOT NULL,
  type            tenant_type NOT NULL DEFAULT 'personal',
  plan            tenant_plan NOT NULL DEFAULT 'free',
  branding        JSONB NOT NULL DEFAULT '{}'::jsonb,
                  -- {logo_url, primary_color, secondary_color, custom_domain}
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
                  -- {default_language, messaging_provider, ai_enabled}
  limits          JSONB NOT NULL DEFAULT '{}'::jsonb,
                  -- {max_invitations, max_guests_per_inv, ai_generations_per_month}
  owner_id        UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
```

### 3.3 `memberships` — User-Tenant join

```sql
CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            membership_role NOT NULL DEFAULT 'editor',
  invited_by      UUID REFERENCES users(id),
  invited_at      TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_tenant ON memberships(tenant_id);
```

---

## 4. Invitation Domain

### 4.1 `invitations`

```sql
CREATE TYPE invitation_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE invitation_kind AS ENUM (
  'wedding', 'engagement', 'birthday', 'aqiqah',
  'khitanan', 'baby_shower', 'corporate', 'other'
);

CREATE TABLE invitations (
  id                  UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug                TEXT NOT NULL
                      CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  kind                invitation_kind NOT NULL DEFAULT 'wedding',
  status              invitation_status NOT NULL DEFAULT 'draft',
  title               TEXT NOT NULL,

  -- Main content (JSONB for flexibility per template)
  content             JSONB NOT NULL DEFAULT '{}'::jsonb,
                      /*
                      {
                        hosts: [
                          { name, nickname, parents, instagram, photo_url, bio }
                        ],
                        story: { sections: [...] },
                        love_story: [...],
                        quotes: [...],
                        thanks_note: "..."
                      }
                      */

  -- Template & theme
  template_id         TEXT NOT NULL,         -- e.g. 'minimalist-modern'
  theme               JSONB NOT NULL DEFAULT '{}'::jsonb,
                      /*
                      {
                        colors: { primary, secondary, accent, bg, text },
                        fonts: { heading, body, accent },
                        music_url: "...",
                        cover_photo: "...",
                        background: "..."
                      }
                      */

  -- Settings
  settings            JSONB NOT NULL DEFAULT '{}'::jsonb,
                      /*
                      {
                        language: 'id',
                        rsvp_enabled: true,
                        rsvp_allow_plus_one: true,
                        wishes_moderation: 'auto' | 'manual',
                        show_guest_count: false,
                        password_protected: false,
                        countdown_enabled: true
                      }
                      */

  -- AI generation metadata
  ai_generation_id    UUID REFERENCES ai_generations(id),
  ai_prompt           TEXT,

  -- Publishing
  published_at        TIMESTAMPTZ,
  unpublished_at      TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,           -- For lifetime limits

  -- Audit
  created_by          UUID NOT NULL REFERENCES users(id),
  updated_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_invitations_tenant ON invitations(tenant_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_invitations_status ON invitations(tenant_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_invitations_published ON invitations(published_at)
  WHERE status = 'published' AND deleted_at IS NULL;
```

### 4.2 `events` — Multi-event support (akad, resepsi, etc.)

```sql
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),

  name            TEXT NOT NULL,               -- "Akad Nikah", "Resepsi"
  description     TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  timezone        TEXT NOT NULL DEFAULT 'Asia/Jakarta',

  location        JSONB NOT NULL DEFAULT '{}'::jsonb,
                  /*
                  {
                    name: "Hotel Mulia",
                    address: "Jl. Asia Afrika...",
                    city: "Jakarta",
                    country: "ID",
                    lat: -6.123,
                    lng: 106.456,
                    map_provider: "google", // or "osm"
                    place_id: "...",
                    waze_url: "..."
                  }
                  */

  dress_code      TEXT,
  notes           TEXT,
  livestream_url  TEXT,
  order_index     INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_invitation ON events(invitation_id, order_index);
```

### 4.3 `guests`

```sql
CREATE TYPE guest_category AS ENUM (
  'family', 'friends', 'colleagues', 'school', 'community', 'vip', 'other'
);

CREATE TABLE guests (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),

  slug            TEXT NOT NULL,               -- nanoid 8 chars
  name            TEXT NOT NULL,
  salutation      TEXT,                        -- "Bpk.", "Ibu", "Sdr/i."
  phone           TEXT,                        -- E.164 format
  email           CITEXT,
  category        guest_category NOT NULL DEFAULT 'other',
  group_name      TEXT,                        -- Custom group label
  plus_one_max    INT NOT NULL DEFAULT 0,      -- 0 = no plus-one allowed
  notes           TEXT,                        -- Internal notes

  -- Tracking
  opened_at       TIMESTAMPTZ,                 -- First open
  open_count      INT NOT NULL DEFAULT 0,
  last_opened_at  TIMESTAMPTZ,

  -- WA send tracking (if broadcast used)
  sent_at         TIMESTAMPTZ,
  send_status     TEXT,                        -- 'pending', 'sent', 'delivered', 'read', 'failed'
  send_error      TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  UNIQUE(invitation_id, slug)
);

CREATE INDEX idx_guests_invitation ON guests(invitation_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_guests_phone ON guests(invitation_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;
```

### 4.4 `rsvps`

```sql
CREATE TYPE rsvp_status AS ENUM ('yes', 'no', 'maybe');

CREATE TABLE rsvps (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
                  -- NULL = covers all events
  guest_id        UUID REFERENCES guests(id) ON DELETE SET NULL,
                  -- NULL = anonymous/non-listed guest
  tenant_id       UUID NOT NULL REFERENCES tenants(id),

  status          rsvp_status NOT NULL,
  guest_name      TEXT NOT NULL,               -- Copy of name at submission
  plus_one_count  INT NOT NULL DEFAULT 0,
  contact         TEXT,                        -- Optional phone/email
  dietary_notes   TEXT,
  meta            JSONB DEFAULT '{}'::jsonb,
                  -- IP hash, user agent for fraud detection

  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Avoid duplicate submissions
  UNIQUE(invitation_id, guest_id, event_id)
);

CREATE INDEX idx_rsvps_invitation ON rsvps(invitation_id);
CREATE INDEX idx_rsvps_guest ON rsvps(guest_id);
```

### 4.5 `wishes` — Buku tamu / ucapan

```sql
CREATE TYPE wish_status AS ENUM ('pending', 'approved', 'rejected', 'spam');

CREATE TABLE wishes (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_id        UUID REFERENCES guests(id) ON DELETE SET NULL,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),

  name            TEXT NOT NULL,
  message         TEXT NOT NULL CHECK (length(message) <= 1000),
  status          wish_status NOT NULL DEFAULT 'pending',

  -- Moderation
  moderated_by    UUID REFERENCES users(id),
  moderated_at    TIMESTAMPTZ,
  spam_score      FLOAT,                       -- 0-1, ML-based

  -- Anti-abuse
  ip_hash         TEXT,                        -- SHA256 of IP
  user_agent_hash TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishes_invitation_status
  ON wishes(invitation_id, status, created_at DESC);
```

### 4.6 `checkins` — QR check-in (Phase 2)

```sql
CREATE TABLE checkins (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  event_id        UUID REFERENCES events(id),
  guest_id        UUID NOT NULL REFERENCES guests(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),

  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by   UUID REFERENCES users(id),  -- Panitia
  device_id       TEXT,                        -- PWA scanner identifier
  notes           TEXT,

  -- Allow multi-event check-in for same guest
  UNIQUE(guest_id, event_id)
);

CREATE INDEX idx_checkins_invitation ON checkins(invitation_id, checked_in_at);
```

---

## 5. Media & Storage

### 5.1 `media`

```sql
CREATE TYPE media_kind AS ENUM (
  'cover', 'gallery', 'prewedding', 'host_avatar', 'background', 'music', 'document'
);

CREATE TABLE media (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invitation_id   UUID REFERENCES invitations(id) ON DELETE CASCADE,
                  -- NULL = tenant-level asset

  kind            media_kind NOT NULL,
  storage_key     TEXT NOT NULL,               -- S3/MinIO object key
  url             TEXT NOT NULL,               -- Public/signed URL
  mime_type       TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL,
  width           INT,
  height          INT,
  duration_ms     INT,                         -- For audio/video

  variants        JSONB DEFAULT '{}'::jsonb,
                  -- { thumb: url, sm: url, md: url, lg: url, webp: url }

  alt_text        TEXT,
  order_index     INT DEFAULT 0,

  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_media_invitation_kind
  ON media(invitation_id, kind, order_index)
  WHERE deleted_at IS NULL;
```

---

## 6. AI Generation

### 6.1 `ai_generations`

```sql
CREATE TYPE ai_gen_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE ai_gen_kind AS ENUM ('template', 'copy', 'image', 'palette');

CREATE TABLE ai_generations (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  invitation_id   UUID REFERENCES invitations(id),

  kind            ai_gen_kind NOT NULL,
  status          ai_gen_status NOT NULL DEFAULT 'queued',

  prompt          TEXT NOT NULL,
  parameters      JSONB DEFAULT '{}'::jsonb,
                  -- { style, mood, colors, language, ... }

  provider        TEXT NOT NULL,               -- 'claude', 'openai', 'flux'
  model           TEXT NOT NULL,
  output          JSONB,                       -- Generated content
  output_assets   JSONB DEFAULT '[]'::jsonb,   -- Generated image URLs

  -- Cost tracking
  tokens_input    INT,
  tokens_output   INT,
  cost_usd        NUMERIC(10, 6),

  -- Quality
  qa_score        FLOAT,                       -- 0-1 auto QA
  user_rating     INT CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback   TEXT,

  -- Timing
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,

  error_message   TEXT,
  retry_count     INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_gen_tenant_created
  ON ai_generations(tenant_id, created_at DESC);
CREATE INDEX idx_ai_gen_status
  ON ai_generations(status, created_at)
  WHERE status IN ('queued', 'running');
```

---

## 7. Analytics

### 7.1 `view_events` — Time-series analytics

```sql
CREATE TABLE view_events (
  id              BIGSERIAL PRIMARY KEY,
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_id        UUID REFERENCES guests(id),
  tenant_id       UUID NOT NULL,

  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Anonymized client info
  ip_hash         TEXT,                        -- SHA256 + salt
  device_type     TEXT,                        -- 'mobile' | 'desktop' | 'tablet'
  browser         TEXT,
  os              TEXT,
  referrer_host   TEXT,                        -- 'whatsapp.com', 'instagram.com'
  country         TEXT,
  city            TEXT,

  -- Event type
  event_type      TEXT NOT NULL,
                  -- 'page_view', 'rsvp_click', 'map_click', 'share_click',
                  -- 'music_play', 'gallery_view'
  event_data      JSONB DEFAULT '{}'::jsonb
);

-- Partition by month for retention
CREATE INDEX idx_view_events_invitation_time
  ON view_events(invitation_id, occurred_at DESC);
CREATE INDEX idx_view_events_tenant_time
  ON view_events(tenant_id, occurred_at DESC);

-- Consider TimescaleDB extension or pg_partman for large scale
```

### 7.2 `analytics_daily` — Materialized aggregates

```sql
CREATE TABLE analytics_daily (
  invitation_id   UUID NOT NULL,
  date            DATE NOT NULL,
  tenant_id       UUID NOT NULL,

  views_total     INT NOT NULL DEFAULT 0,
  views_unique    INT NOT NULL DEFAULT 0,
  rsvp_yes        INT NOT NULL DEFAULT 0,
  rsvp_no         INT NOT NULL DEFAULT 0,
  rsvp_maybe      INT NOT NULL DEFAULT 0,
  wishes_count    INT NOT NULL DEFAULT 0,
  shares_count    INT NOT NULL DEFAULT 0,

  device_breakdown JSONB DEFAULT '{}'::jsonb,
  source_breakdown JSONB DEFAULT '{}'::jsonb,

  PRIMARY KEY (invitation_id, date)
);

-- Updated nightly via cron job from view_events
```

---

## 8. Messaging & Notifications

### 8.1 `messages` — Outbound messaging log

```sql
CREATE TYPE message_channel AS ENUM ('whatsapp', 'sms', 'email', 'telegram');
CREATE TYPE message_status AS ENUM (
  'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'expired'
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  invitation_id   UUID REFERENCES invitations(id),
  guest_id        UUID REFERENCES guests(id),

  channel         message_channel NOT NULL,
  provider        TEXT NOT NULL,              -- 'cloud-api', 'fonnte', 'smtp'
  to_address      TEXT NOT NULL,              -- phone or email
  template_id     TEXT,                       -- Provider template ID if any

  content         TEXT,
  variables       JSONB DEFAULT '{}'::jsonb,

  status          message_status NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,                   -- ID from provider
  error_code      TEXT,
  error_message   TEXT,

  -- Timestamps
  queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ
);

CREATE INDEX idx_messages_tenant_status
  ON messages(tenant_id, status, queued_at);
CREATE INDEX idx_messages_guest ON messages(guest_id);
```

### 8.2 `messaging_credentials` — Per-tenant provider config

```sql
CREATE TABLE messaging_credentials (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,              -- 'cloud-api', 'fonnte', etc.
  display_name    TEXT NOT NULL,
  credentials_encrypted BYTEA NOT NULL,       -- AES-256-GCM encrypted JSON
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Health
  last_used_at    TIMESTAMPTZ,
  last_error_at   TIMESTAMPTZ,
  last_error      TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, provider, display_name)
);
```

---

## 9. Billing & Subscriptions (Future)

### 9.1 `subscriptions` (placeholder for future)

```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(id),
  plan            tenant_plan NOT NULL,
  status          TEXT NOT NULL,              -- 'active', 'canceled', 'past_due'
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  -- Provider-agnostic fields (Stripe/Midtrans/Xendit)
  provider        TEXT,
  external_id     TEXT,
  meta            JSONB DEFAULT '{}'::jsonb,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10. Audit & System

### 10.1 `audit_logs`

```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID REFERENCES tenants(id),
  actor_id        UUID REFERENCES users(id),
  actor_type      TEXT NOT NULL,              -- 'user', 'system', 'api'

  action          TEXT NOT NULL,              -- 'invitation.published'
  resource_type   TEXT NOT NULL,              -- 'invitation', 'guest', etc.
  resource_id     UUID NOT NULL,

  changes         JSONB,                       -- Before/after diff
  ip_address      INET,
  user_agent      TEXT,

  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant_time
  ON audit_logs(tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_resource
  ON audit_logs(resource_type, resource_id);
```

### 10.2 `webhook_endpoints` (Phase 2)

```sql
CREATE TABLE webhook_endpoints (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  events          TEXT[] NOT NULL,            -- ['rsvp.submitted', 'guest.checked_in']
  secret          TEXT NOT NULL,              -- For HMAC signature
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 11. Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy
CREATE POLICY tenant_isolation_select ON invitations
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation_modify ON invitations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Public read policy for published invitations (anonymous access)
CREATE POLICY public_read_published ON invitations
  FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);
```

---

## 12. Performance Considerations

### 12.1 Critical Indexes

Already documented inline. Key compound indexes:
- `(tenant_id, status)` for listing dashboards
- `(invitation_id, status, created_at DESC)` for wishes feed
- `(invitation_id, occurred_at DESC)` for analytics time-series

### 12.2 Hot Path Queries

1. **Render public invitation:**
   ```sql
   SELECT i.*,
          (SELECT json_agg(e ORDER BY order_index) FROM events e
           WHERE e.invitation_id = i.id) AS events
   FROM invitations i
   WHERE i.tenant_id = $1 AND i.slug = $2
     AND i.status = 'published' AND i.deleted_at IS NULL;
   ```
   → Cache in Redis with 5 min TTL, invalidate on update

2. **Submit RSVP:** Single insert + trigger webhook (async)

3. **Guest dashboard:**
   ```sql
   SELECT g.*, r.status AS rsvp_status
   FROM guests g
   LEFT JOIN rsvps r ON r.guest_id = g.id
   WHERE g.invitation_id = $1
   LIMIT 50 OFFSET $2;
   ```

### 12.3 Partitioning Strategy

When `view_events` exceeds 10M rows:
- Partition by `occurred_at` (monthly)
- Use pg_partman for management
- Retention: 12 months hot, then aggregate-and-drop

### 12.4 Scale Targets (Single Postgres Instance)

| Metric | Target |
|--------|--------|
| Invitations | 100k |
| Guests per invitation | 5k |
| Total guests | 10M |
| RSVPs/wishes daily | 100k |
| View events daily | 10M |

Beyond these, consider read replicas + analytics warehouse (ClickHouse/DuckDB).

---

## 13. Migration Strategy

- **Tool:** Drizzle Kit migrations
- **Convention:** `YYYYMMDD_HHMM_description.sql`
- **Rules:**
  - Migrations are forward-only in production
  - All schema changes require down-migration in dev
  - Breaking changes require dual-write transition
  - Never drop columns without 2-release deprecation

---

## 14. Seed Data

### 14.1 System tenant
```sql
INSERT INTO tenants (id, slug, name, type, plan, owner_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'system',
        'System', 'system', 'enterprise', NULL);
```

### 14.2 Built-in templates (registered in code, not DB)
Templates are React packages, not DB rows. DB only stores `template_id` reference.
