import { eq } from "drizzle-orm";
import { creditTransactions, tenants } from "./schema";
import { uuidv7 } from "./uuid";
import { withTenantRls } from "./with-tenant";

export class InsufficientCreditError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(`Saldo tidak cukup: butuh Rp ${required}, tersedia Rp ${available}`);
    this.name = "InsufficientCreditError";
  }
}

export type CreditTransactionType = "topup" | "debit_ai_generation" | "debit_template_unlock";

interface LedgerOpts {
  referenceType?: string;
  referenceId?: string;
  description?: string;
}

async function writeLedgerEntry(
  tenantId: string,
  amount: number,
  type: CreditTransactionType,
  opts: LedgerOpts,
): Promise<{ balanceAfter: number }> {
  return withTenantRls(tenantId, async (tx) => {
    // Row lock — serializes concurrent debits/topups for the same tenant so
    // two simultaneous requests can't both read a stale balance and both
    // succeed past zero.
    const [row] = await tx
      .select({ creditBalance: tenants.creditBalance })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .for("update");

    if (!row) throw new Error(`Tenant not found: ${tenantId}`);

    const newBalance = row.creditBalance + amount;
    if (newBalance < 0) {
      throw new InsufficientCreditError(-amount, row.creditBalance);
    }

    await tx
      .update(tenants)
      .set({ creditBalance: newBalance, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    await tx.insert(creditTransactions).values({
      id: uuidv7(),
      tenantId,
      type,
      amount,
      balanceAfter: newBalance,
      referenceType: opts.referenceType ?? null,
      referenceId: opts.referenceId ?? null,
      description: opts.description ?? null,
      createdAt: new Date(),
    });

    return { balanceAfter: newBalance };
  });
}

/**
 * Debit `amount` (positive number) from tenant's credit balance.
 * Throws InsufficientCreditError if the balance would go negative.
 */
export async function debitCredit(
  tenantId: string,
  amount: number,
  type: Exclude<CreditTransactionType, "topup">,
  opts: LedgerOpts = {},
): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error("debitCredit amount must be positive");
  return writeLedgerEntry(tenantId, -amount, type, opts);
}

/**
 * Add `amount` (positive number) to tenant's credit balance. Used only by
 * the admin top-up approval flow.
 */
export async function creditTopup(
  tenantId: string,
  amount: number,
  referenceId: string,
  description?: string,
): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error("creditTopup amount must be positive");
  return writeLedgerEntry(tenantId, amount, "topup", {
    referenceType: "topup_request",
    referenceId,
    ...(description !== undefined ? { description } : {}),
  });
}
