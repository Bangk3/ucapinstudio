-- messaging_provider_type enum
CREATE TYPE "public"."messaging_provider_type" AS ENUM('whatsapp_cloud', 'fonnte', 'wablas', 'smtp');
--> statement-breakpoint
-- message_status enum
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');
--> statement-breakpoint
-- message_channel enum
CREATE TYPE "public"."message_channel" AS ENUM('whatsapp', 'sms', 'email');
--> statement-breakpoint

CREATE TABLE "messaging_credentials" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "provider" "messaging_provider_type" NOT NULL,
  "encrypted_config" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "messaging_credentials_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE
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
  "status" "message_status" NOT NULL DEFAULT 'pending',
  "provider_id" varchar(255),
  "error" text,
  "sent_at" timestamptz,
  "delivered_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "messages_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "messages_invitation_id_invitations_id_fk"
    FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE SET NULL,
  CONSTRAINT "messages_guest_id_guests_id_fk"
    FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE SET NULL
);
--> statement-breakpoint

CREATE INDEX "messaging_creds_tenant_idx" ON "messaging_credentials" ("tenant_id");
--> statement-breakpoint
CREATE INDEX "messages_tenant_idx" ON "messages" ("tenant_id");
--> statement-breakpoint
CREATE INDEX "messages_invitation_idx" ON "messages" ("invitation_id");
--> statement-breakpoint
CREATE INDEX "messages_guest_idx" ON "messages" ("guest_id");
--> statement-breakpoint
CREATE INDEX "messages_provider_id_idx" ON "messages" ("provider_id");
