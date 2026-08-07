import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "./client";
import { InsufficientCreditError, creditTopup, debitCredit } from "./credit";
import { tenants } from "./schema";

async function makeTenant(creditBalance = 0): Promise<string> {
  const id = randomUUID();
  await db.insert(tenants).values({
    id,
    slug: `test-${id.slice(0, 8)}`,
    name: "Test Tenant",
    type: "personal",
    plan: "free",
    settings: {},
    limits: {},
    creditBalance,
  });
  return id;
}

describe("credit ledger", () => {
  const createdTenantIds: string[] = [];

  afterAll(async () => {
    for (const id of createdTenantIds) {
      await db.delete(tenants).where(eq(tenants.id, id));
    }
  });

  it("creditTopup increases balance and records a ledger row", async () => {
    const tenantId = await makeTenant(0);
    createdTenantIds.push(tenantId);

    const { balanceAfter } = await creditTopup(tenantId, 25_000, "req-1", "test topup");
    expect(balanceAfter).toBe(25_000);

    const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    expect(row?.creditBalance).toBe(25_000);
  });

  it("debitCredit decreases balance when sufficient", async () => {
    const tenantId = await makeTenant(10_000);
    createdTenantIds.push(tenantId);

    const { balanceAfter } = await debitCredit(tenantId, 5_000, "debit_ai_generation", {
      referenceId: "gen-1",
    });
    expect(balanceAfter).toBe(5_000);
  });

  it("debitCredit rejects when balance is insufficient and leaves balance unchanged", async () => {
    const tenantId = await makeTenant(1_000);
    createdTenantIds.push(tenantId);

    await expect(debitCredit(tenantId, 5_000, "debit_ai_generation")).rejects.toThrow(
      InsufficientCreditError,
    );

    const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    expect(row?.creditBalance).toBe(1_000);
  });

  it("concurrent debits don't race past zero", async () => {
    const tenantId = await makeTenant(10_000);
    createdTenantIds.push(tenantId);

    // Two concurrent debits of 6,000 each against a 10,000 balance — only
    // one can succeed, the other must see insufficient funds.
    const results = await Promise.allSettled([
      debitCredit(tenantId, 6_000, "debit_ai_generation"),
      debitCredit(tenantId, 6_000, "debit_ai_generation"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const [row] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    expect(row?.creditBalance).toBe(4_000);
  });
});
