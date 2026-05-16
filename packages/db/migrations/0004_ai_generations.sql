CREATE TYPE "public"."ai_generation_status" AS ENUM('pending', 'running', 'done', 'failed');
--> statement-breakpoint

CREATE TABLE "ai_generations" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "invitation_id" text,
  "status" "ai_generation_status" NOT NULL DEFAULT 'pending',
  "model" varchar(100),
  "input_tokens" integer,
  "output_tokens" integer,
  "cost_usd" numeric(10, 6),
  "variants" jsonb,
  "error_message" text,
  "qa_score" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ai_generations_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "ai_generations_invitation_id_invitations_id_fk"
    FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX "ai_generations_tenant_idx" ON "ai_generations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX "ai_generations_invitation_idx" ON "ai_generations" ("invitation_id");
