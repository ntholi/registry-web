CREATE TABLE "term_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"term_id" integer NOT NULL,
	"results_published" boolean DEFAULT false NOT NULL,
	"lecturer_gradebook_access" boolean DEFAULT false NOT NULL,
	"gradebook_open_date" date,
	"gradebook_close_date" date,
	"registration_start_date" date,
	"registration_end_date" date,
	"created_at" timestamp DEFAULT now(),
	"created_by" text,
	"updated_at" timestamp,
	"updated_by" text,
	CONSTRAINT "term_settings_termId_unique" UNIQUE("term_id")
);
--> statement-breakpoint
ALTER TABLE "term_settings" ADD CONSTRAINT "term_settings_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_settings" ADD CONSTRAINT "term_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_settings" ADD CONSTRAINT "term_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Create term_settings for all existing terms
INSERT INTO "term_settings" ("term_id", "results_published", "lecturer_gradebook_access")
SELECT id, NOT is_active, false FROM "terms";
