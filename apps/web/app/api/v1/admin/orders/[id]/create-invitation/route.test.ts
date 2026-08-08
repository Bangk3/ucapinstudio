import { randomUUID } from "node:crypto";
import { db, invitations, orders, tenants, user } from "@invyte/db";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createInvitationFromOrder } from "./route";

// Regression test for the create-invitation-from-order race found and fixed
// during this plan (row-locked with `for("update")` + an `invitationId`
// already-set check inside one transaction). Mirrors credit.test.ts's
// Promise.allSettled concurrency pattern, against a real Postgres instance.

async function makeFixture() {
  const userId = randomUUID();
  const tenantId = randomUUID();
  const orderId = randomUUID();

  await db.insert(user).values({
    id: userId,
    name: "Test Staff",
    email: `test-${userId.slice(0, 8)}@example.com`,
  });

  await db.insert(tenants).values({
    id: tenantId,
    slug: `test-order-${tenantId.slice(0, 8)}`,
    name: "Test Tenant",
    type: "organization",
    plan: "free",
    settings: {},
    limits: {},
  });

  await db.insert(orders).values({
    id: orderId,
    customerName: "Test Customer",
    customerContact: "0812xxxxxxx",
    price: 500_000,
    createdBy: userId,
    tenantId,
    accessToken: randomUUID(),
    paymentStatus: "paid",
    createdAt: new Date(),
  });

  return { userId, tenantId, orderId };
}

describe("createInvitationFromOrder concurrency", () => {
  const createdUserIds: string[] = [];
  const createdTenantIds: string[] = [];

  afterEach(async () => {
    for (const id of createdTenantIds.splice(0)) {
      // Cascades orders + invitations rows for this tenant.
      await db.delete(tenants).where(eq(tenants.id, id));
    }
    for (const id of createdUserIds.splice(0)) {
      await db.delete(user).where(eq(user.id, id));
    }
  });

  it("creates exactly one invitation when fired twice concurrently for the same order", async () => {
    const { userId, tenantId, orderId } = await makeFixture();
    createdTenantIds.push(tenantId);
    createdUserIds.push(userId);

    const results = await Promise.allSettled([
      createInvitationFromOrder(orderId),
      createInvitationFromOrder(orderId),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const invitationRows = await db
      .select()
      .from(invitations)
      .where(eq(invitations.tenantId, tenantId));
    expect(invitationRows).toHaveLength(1);

    const [orderRow] = await db.select().from(orders).where(eq(orders.id, orderId));
    expect(orderRow?.invitationId).toBe(invitationRows[0]?.id);
  });
});
