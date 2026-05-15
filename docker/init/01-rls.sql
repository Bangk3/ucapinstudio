-- Enable RLS on tenant-scoped tables (runs after migrations)
-- This file is for future use when Drizzle migrations are in place.

-- Example:
-- ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON invitations
--   USING (tenant_id = current_setting('app.current_tenant')::uuid);

SELECT 'RLS init placeholder — configure after running db:migrate' AS note;
