import type { NextRequest } from "next/server";
import { auth } from "./auth";
import type { AuthSession } from "./session";

export type AdminAuthResult = { ok: true; session: AuthSession } | { ok: false; status: 401 | 403 };

const ADMIN_ROLES = new Set(["superadmin", "admin"]);

/**
 * Gate for every /api/v1/admin/* route. Read access (write: false, the
 * default) is granted to both "admin" and "superadmin". Mutating actions
 * (write: true) require "superadmin" — "admin" gets 403.
 */
export async function requireAdminSession(
  req: NextRequest,
  opts: { write?: boolean } = {},
): Promise<AdminAuthResult> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return { ok: false, status: 401 };

  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) return { ok: false, status: 403 };
  if (opts.write && role !== "superadmin") return { ok: false, status: 403 };

  return { ok: true, session: session as AuthSession };
}
