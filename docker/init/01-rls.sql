-- Invyte — PostgreSQL init script
-- This file runs when the Docker container first creates the database.
-- At this point, no application tables exist yet (Drizzle creates them).
--
-- Row Level Security policies are applied separately by setup.sh
-- AFTER running `pnpm --filter @invyte/db db:migrate`.
-- See: packages/db/rls.sql

-- Nothing to do here — placeholder kept for future DB-level config
-- (e.g. extensions, roles, custom types that predate migrations).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
