CREATE TABLE "checkins" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "invitation_id" text NOT NULL,
  "guest_id" text NOT NULL,
  "checked_in_at" timestamptz NOT NULL DEFAULT now(),
  "method" varchar(20) NOT NULL DEFAULT 'qr',
  "operator_note" text,
  CONSTRAINT "checkins_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "checkins_invitation_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE CASCADE,
  CONSTRAINT "checkins_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "checkins_invitation_idx" ON "checkins" ("invitation_id");
--> statement-breakpoint
CREATE INDEX "checkins_guest_idx" ON "checkins" ("guest_id");
