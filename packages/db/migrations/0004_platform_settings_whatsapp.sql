ALTER TYPE "public"."platform_setting_key" ADD VALUE 'admin_whatsapp_number';--> statement-breakpoint
ALTER TABLE "platform_settings" ALTER COLUMN "value" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "value_text" text;