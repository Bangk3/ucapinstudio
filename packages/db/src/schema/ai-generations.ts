import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { invitations } from "./invitations.js";
import { tenants } from "./tenants.js";

export const aiGenerationStatusEnum = pgEnum("ai_generation_status", [
  "pending",
  "running",
  "done",
  "failed",
]);

export const aiGenerations = pgTable(
  "ai_generations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id").references(() => invitations.id, {
      onDelete: "set null",
    }),
    status: aiGenerationStatusEnum("status").notNull().default("pending"),
    model: varchar("model", { length: 100 }),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
    // JSON array of 3 GenerationVariant
    variants: jsonb("variants"),
    errorMessage: text("error_message"),
    qaScore: integer("qa_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ai_generations_tenant_idx").on(t.tenantId),
    index("ai_generations_invitation_idx").on(t.invitationId),
  ],
);

export type AiGeneration = typeof aiGenerations.$inferSelect;
export type NewAiGeneration = typeof aiGenerations.$inferInsert;
