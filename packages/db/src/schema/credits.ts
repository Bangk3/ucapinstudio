import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { tenants } from "./tenants";

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "topup",
  "debit_ai_generation",
  "debit_template_unlock",
]);

export const topupRequestStatusEnum = pgEnum("topup_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: creditTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_transactions_tenant_idx").on(t.tenantId, t.createdAt)],
);

export const topupRequests = pgTable(
  "topup_requests",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    packageAmount: integer("package_amount").notNull(),
    proofImageUrl: text("proof_image_url").notNull(),
    status: topupRequestStatusEnum("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("topup_requests_status_idx").on(t.status, t.createdAt)],
);

export const templateUnlocks = pgTable(
  "template_unlocks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("template_unlocks_tenant_template_idx").on(t.tenantId, t.templateId)],
);

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type TopupRequest = typeof topupRequests.$inferSelect;
export type NewTopupRequest = typeof topupRequests.$inferInsert;
export type TemplateUnlock = typeof templateUnlocks.$inferSelect;
export type NewTemplateUnlock = typeof templateUnlocks.$inferInsert;
