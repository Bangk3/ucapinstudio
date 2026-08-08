import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// "admin" is read-only at this app's own layer (see require-admin.ts) and
// never calls better-auth's native admin.* client/API methods (the app
// queries the DB directly for its /api/v1/admin/* routes). It gets zero
// better-auth admin statements so native endpoints like
// /api/auth/admin/set-role or /api/auth/admin/ban-user — which bypass
// requireAdminSession entirely — reject it instead of silently allowing
// ban/set-role/delete/impersonate/set-password.
export const admin = ac.newRole({ user: [], session: [] });

// "superadmin" is this app's read+write admin tier and gets every
// better-auth admin capability.
export const superadmin = ac.newRole({
  ...adminAc.statements,
});
