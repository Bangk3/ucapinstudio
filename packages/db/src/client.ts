import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

function createClient(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return drizzle(postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10 }), { schema });
}

// Lazy proxy — createClient() is deferred until first property access.
// This prevents Next.js build-phase module analysis from throwing when
// DATABASE_URL is not available at import time (e.g. static route scan).
const g = globalThis as typeof globalThis & { __invyte_db?: DbClient };
export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop) {
    if (!g.__invyte_db) g.__invyte_db = createClient();
    return Reflect.get(g.__invyte_db, prop);
  },
});
export type Database = DbClient;
