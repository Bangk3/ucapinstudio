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
ALTER TABLE "analytics_daily" ADD CONSTRAINT "analytics_daily_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;