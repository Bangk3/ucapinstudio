CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_type" AS ENUM('personal', 'organization', 'system');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."invitation_kind" AS ENUM('wedding', 'engagement', 'birthday', 'aqiqah', 'khitanan', 'baby_shower', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."guest_category" AS ENUM('family', 'friends', 'colleagues', 'school', 'community', 'vip', 'other');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('yes', 'no', 'maybe');--> statement-breakpoint
CREATE TYPE "public"."wish_status" AS ENUM('pending', 'approved', 'rejected', 'spam');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'audio', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('whatsapp', 'sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."messaging_provider_type" AS ENUM('whatsapp_cloud', 'fonnte', 'wablas', 'smtp');--> statement-breakpoint
CREATE TYPE "public"."ai_generation_status" AS ENUM('pending', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_tenant_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locale" varchar(10) DEFAULT 'id' NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Jakarta' NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(48) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "tenant_type" DEFAULT 'personal' NOT NULL,
	"plan" "tenant_plan" DEFAULT 'free' NOT NULL,
	"logo_url" text,
	"primary_color" varchar(7),
	"custom_domain" varchar(255),
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"role" "member_role" DEFAULT 'owner' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "memberships_user_id_tenant_id_pk" PRIMARY KEY("user_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" "invitation_status" DEFAULT 'draft' NOT NULL,
	"kind" "invitation_kind" DEFAULT 'wedding' NOT NULL,
	"template_id" varchar(100),
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rsvp_enabled" boolean DEFAULT true NOT NULL,
	"wishes_enabled" boolean DEFAULT true NOT NULL,
	"wishes_moderated" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" timestamp with time zone,
	"duration_minutes" integer,
	"venue_name" varchar(255),
	"venue_address" text,
	"lat" double precision,
	"lng" double precision,
	"maps_url" text,
	"livestream_url" text,
	"dress_code" varchar(100),
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"slug" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"phone_hash" varchar(64),
	"email" varchar(255),
	"category" "guest_category" DEFAULT 'other' NOT NULL,
	"plus_one_allowed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"opened_at" timestamp with time zone,
	"open_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"send_status" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"guest_id" text,
	"event_id" text,
	"status" "rsvp_status" NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"plus_one_count" integer DEFAULT 0 NOT NULL,
	"dietary_notes" text,
	"ip_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rsvps_guest_event_unique" UNIQUE("guest_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "wishes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"guest_id" text,
	"sender_name" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "wish_status" DEFAULT 'pending' NOT NULL,
	"spam_score" real DEFAULT 0 NOT NULL,
	"moderated_by" text,
	"moderated_at" timestamp with time zone,
	"ip_hash" varchar(64),
	"user_agent_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"type" "media_type" NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration_seconds" integer,
	"variants" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"alt_text" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "analytics_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"date" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"rsvp_yes" integer DEFAULT 0 NOT NULL,
	"rsvp_no" integer DEFAULT 0 NOT NULL,
	"rsvp_maybe" integer DEFAULT 0 NOT NULL,
	"wishes" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_daily_invitation_id_date_unique" UNIQUE("invitation_id","date")
);
--> statement-breakpoint
CREATE TABLE "view_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"guest_id" text,
	"ip_hash" varchar(64),
	"user_agent" text,
	"referrer" text,
	"device" varchar(20),
	"country" varchar(2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
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
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_moderated_by_user_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily" ADD CONSTRAINT "analytics_daily_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging_credentials" ADD CONSTRAINT "messaging_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenants_custom_domain_idx" ON "tenants" USING btree ("custom_domain");--> statement-breakpoint
CREATE INDEX "memberships_tenant_idx" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_tenant_status_idx" ON "invitations" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "invitations_tenant_slug_idx" ON "invitations" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "invitations_created_idx" ON "invitations" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "events_invitation_idx" ON "events" USING btree ("invitation_id","sort_order");--> statement-breakpoint
CREATE INDEX "guests_invitation_idx" ON "guests" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "guests_slug_idx" ON "guests" USING btree ("invitation_id","slug");--> statement-breakpoint
CREATE INDEX "guests_tenant_idx" ON "guests" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_invitation_phone_hash_unique" ON "guests" USING btree ("invitation_id","phone_hash") WHERE "guests"."phone_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "rsvps_invitation_idx" ON "rsvps" USING btree ("invitation_id","status");--> statement-breakpoint
CREATE INDEX "rsvps_guest_event_idx" ON "rsvps" USING btree ("guest_id","event_id");--> statement-breakpoint
CREATE INDEX "wishes_invitation_status_idx" ON "wishes" USING btree ("invitation_id","status");--> statement-breakpoint
CREATE INDEX "wishes_created_idx" ON "wishes" USING btree ("invitation_id","created_at");--> statement-breakpoint
CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX "messages_tenant_idx" ON "messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "messages_invitation_idx" ON "messages" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "messages_guest_idx" ON "messages" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "messages_provider_id_idx" ON "messages" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "messaging_creds_tenant_idx" ON "messaging_credentials" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_generations_tenant_idx" ON "ai_generations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_generations_invitation_idx" ON "ai_generations" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "checkins_invitation_idx" ON "checkins" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "checkins_guest_idx" ON "checkins" USING btree ("guest_id");