import { describe, expect, it } from "vitest";
import { admin, superadmin } from "./permissions";

// Regression test for the Critical bug found in an earlier review: `admin`
// and `superadmin` both had identical, full better-auth statements, letting
// `admin` self-promote via better-auth's native endpoints (e.g.
// /api/auth/admin/set-role). `admin` must get zero privileged capabilities
// at better-auth's own layer — this app enforces admin access itself via
// require-admin.ts + direct DB queries instead.
const dangerousUserActions = ["ban", "set-role", "delete", "impersonate", "set-password"] as const;

describe("permissions: admin vs superadmin", () => {
  it("admin has no user-resource permissions at all", () => {
    expect(admin.statements.user ?? []).toEqual([]);
  });

  it("admin has no session-resource permissions at all", () => {
    expect(admin.statements.session ?? []).toEqual([]);
  });

  it("admin.authorize rejects every dangerous user action", () => {
    for (const action of dangerousUserActions) {
      expect(admin.authorize({ user: [action] }).success).toBe(false);
    }
  });

  it("superadmin retains every dangerous user action", () => {
    for (const action of dangerousUserActions) {
      expect(superadmin.statements.user).toContain(action);
      expect(superadmin.authorize({ user: [action] }).success).toBe(true);
    }
  });
});
