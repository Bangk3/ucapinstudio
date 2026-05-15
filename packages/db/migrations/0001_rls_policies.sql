-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0001: Row-Level Security (RLS) — defense-in-depth tenant isolation
--
-- Strategy: PERMISSIVE policy that allows all access when app.tenant_id is NOT
-- set (preserving public-route behavior) and enforces isolation when it IS set
-- (authenticated dashboard routes that call set_config('app.tenant_id', ...)).
--
-- Tables: invitations, events, guests, rsvps, wishes, media, memberships
-- Auth tables (user, session, account, verification) are NOT tenant-scoped.
-- ─────────────────────────────────────────────────────────────────────────────

--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rsvps" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "wishes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "invitations"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "events"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "guests"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "rsvps"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "wishes"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "media"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );

--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "memberships"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  )
  WITH CHECK (
    COALESCE(current_setting('app.tenant_id', true), '') = ''
    OR tenant_id = COALESCE(current_setting('app.tenant_id', true), '')
  );
