CREATE TYPE "public"."message_channel" AS ENUM('whatsapp', 'sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."messaging_provider_type" AS ENUM('whatsapp_cloud', 'fonnte', 'wablas', 'smtp');--> statement-breakpoint
CREATE TYPE "public"."ai_generation_status" AS ENUM('pending', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text,
	"guest_id" text,
	"channel" "message_channel" NOT NULL,
	"provider" "messaging_provider_type" NOT NULL,
	"to" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"provider_id" varchar(255),
	"error" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messaging_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"provider" "messaging_provider_type" NOT NULL,
	"encrypted_config" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text,
	"status" "ai_generation_status" DEFAULT 'pending' NOT NULL,
	"model" varchar(100),
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" numeric(10, 6),
	"variants" jsonb,
	"error_message" text,
	"qa_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" varchar(20) DEFAULT 'qr' NOT NULL,
	"operator_note" text
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging_credentials" ADD CONSTRAINT "messaging_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_tenant_idx" ON "messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "messages_invitation_idx" ON "messages" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "messages_guest_idx" ON "messages" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "messages_provider_id_idx" ON "messages" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "messaging_creds_tenant_idx" ON "messaging_credentials" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_generations_tenant_idx" ON "ai_generations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_generations_invitation_idx" ON "ai_generations" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "checkins_invitation_idx" ON "checkins" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "checkins_guest_idx" ON "checkins" USING btree ("guest_id");