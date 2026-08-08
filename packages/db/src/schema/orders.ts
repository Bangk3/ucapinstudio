import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { invitations } from "./invitations";
import { tenants } from "./tenants";

export const orderPaymentStatusEnum = pgEnum("order_payment_status", [
  "pending",
  "paid",
  "rejected",
]);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    customerContact: text("customer_contact").notNull(),
    notes: text("notes"),
    price: integer("price").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id").references(() => invitations.id, { onDelete: "set null" }),
    accessToken: text("access_token").notNull(),
    submittedData: jsonb("submitted_data"),
    paymentStatus: orderPaymentStatusEnum("payment_status").notNull().default("pending"),
    proofImageUrl: text("proof_image_url"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.paymentStatus, t.createdAt),
    uniqueIndex("orders_access_token_idx").on(t.accessToken),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
