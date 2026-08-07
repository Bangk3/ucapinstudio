-- ============================================================
-- Invyte — Row Level Security Policies
-- Run AFTER Drizzle migrations have created all tables.
-- Usage: psql $DATABASE_URL -f packages/db/rls.sql
--        (or via setup.sh which calls this automatically)
--
-- Design:
--   All tenant-scoped tables use a single isolation policy keyed on
--   current_setting('app.tenant_id', true), set by withTenantRls().
--
--   Exception: invitations has an additional public SELECT policy so
--   that unauthenticated routes can look up published invitations
--   before switching to withTenantRls() for the rest of the request.
--
--   FORCE ROW LEVEL SECURITY ensures the policy applies even when
--   the connected DB user owns the table (e.g. during development).
-- ============================================================

-- ── memberships ─────────────────────────────────────────────
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memberships_tenant_iso ON memberships;
CREATE POLICY memberships_tenant_iso ON memberships
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- ── invitations ─────────────────────────────────────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

-- Authenticated access: full CRUD within tenant context
DROP POLICY IF EXISTS invitations_tenant_iso ON invitations;
CREATE POLICY invitations_tenant_iso ON invitations
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- Public access: read published invitations without tenant context
-- Used by public pages and for initial validation in RSVP/wish routes
DROP POLICY IF EXISTS invitations_public_read ON invitations;
CREATE POLICY invitations_public_read ON invitations
  FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
    AND NULLIF(current_setting('app.tenant_id', true), '') IS NULL
  );

-- ── events ───────────────────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_tenant_iso ON events;
CREATE POLICY events_tenant_iso ON events
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- ── guests ───────────────────────────────────────────────────
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guests_tenant_iso ON guests;
CREATE POLICY guests_tenant_iso ON guests
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- ── rsvps ────────────────────────────────────────────────────
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rsvps_tenant_iso ON rsvps;
CREATE POLICY rsvps_tenant_iso ON rsvps
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- ── wishes ───────────────────────────────────────────────────
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wishes_tenant_iso ON wishes;
CREATE POLICY wishes_tenant_iso ON wishes
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

-- ── media ────────────────────────────────────────────────────
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_tenant_iso ON media;
CREATE POLICY media_tenant_iso ON media
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));

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

-- ── auth tables: no RLS ───────────────────────────────────────
-- user, session, account, verification — not tenant-scoped.
-- Better Auth manages these; app-layer session checks provide isolation.

-- ── tenants: no RLS ──────────────────────────────────────────
-- Looked up before tenant context is set. App-level membership
-- check (via middleware + withTenantRls) provides isolation.

SELECT format(
  'RLS applied: %s policies across %s tables',
  count(*),
  count(DISTINCT tablename)
) AS result
FROM pg_policies
WHERE schemaname = 'public';
