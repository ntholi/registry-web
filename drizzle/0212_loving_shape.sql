CREATE TABLE "mail_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"trigger_type" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mail_templates_triggerType_unique" UNIQUE("trigger_type")
);
--> statement-breakpoint
ALTER TABLE "mail_templates" ADD CONSTRAINT "mail_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;