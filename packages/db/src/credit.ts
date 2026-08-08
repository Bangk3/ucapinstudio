import { eq } from "drizzle-orm";
import type { Database } from "./client";
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

/**
 * Core ledger write. Assumes it's already running inside a `withTenantRls`
 * transaction (`tx`) — does not open its own. Callers that need the debit
 * atomic with other writes (e.g. template unlock) call this directly inside
 * their own `withTenantRls` block via `debitCreditInTx`.
 */
async function writeLedgerEntryInTx(
  tx: Database,
  tenantId: string,
  amount: number,
  type: CreditTransactionType,
  opts: LedgerOpts,
): Promise<{ balanceAfter: number }> {
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
}

async function writeLedgerEntry(
  tenantId: string,
  amount: number,
  type: CreditTransactionType,
  opts: LedgerOpts,
): Promise<{ balanceAfter: number }> {
  return withTenantRls(tenantId, (tx) => writeLedgerEntryInTx(tx, tenantId, amount, type, opts));
}

/**
 * Same as `debitCredit`, but assumes `tx` is already an open `withTenantRls`
 * transaction — for callers that need the debit atomic with another write
 * (e.g. recording a template unlock) so a crash or a concurrent duplicate
 * request can't charge without recording, or record without charging.
 */
export async function debitCreditInTx(
  tx: Database,
  tenantId: string,
  amount: number,
  type: Exclude<CreditTransactionType, "topup">,
  opts: LedgerOpts = {},
): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error("debitCredit amount must be positive");
  return writeLedgerEntryInTx(tx, tenantId, -amount, type, opts);
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
 * Same as `creditTopup`, but assumes `tx` is already an open `withTenantRls`
 * transaction — for callers (the top-up approval route) that need the
 * credit atomic with the request's status update, so two concurrent
 * approve/reject calls on the same request can't both credit the tenant.
 */
export async function creditTopupInTx(
  tx: Database,
  tenantId: string,
  amount: number,
  referenceId: string,
  description?: string,
): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error("creditTopup amount must be positive");
  return writeLedgerEntryInTx(tx, tenantId, amount, "topup", {
    referenceType: "topup_request",
    referenceId,
    ...(description !== undefined ? { description } : {}),
  });
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
