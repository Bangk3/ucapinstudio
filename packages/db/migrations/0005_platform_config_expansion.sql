CREATE TYPE "public"."platform_credential_provider" AS ENUM('whatsapp_cloud', 'fonnte', 'wablas', 'anthropic', 'fal');--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'support_email';--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'social_instagram';--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'social_twitter';--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'feature_ai_enabled';--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'feature_messaging_enabled';--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'wish_spam_threshold';--> statement-breakpoint
ALTER TYPE "public"."platform_setting_key" ADD VALUE 'wish_banned_words';--> statement-breakpoint
CREATE TABLE "platform_credentials" (
	"provider" "platform_credential_provider" PRIMARY KEY NOT NULL,
	"encrypted_config" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_credentials" ADD CONSTRAINT "platform_credentials_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;