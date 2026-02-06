CREATE TABLE "library_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_loan_duration" integer DEFAULT 14 NOT NULL,
	"staff_loan_duration" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" text,
	"updated_at" timestamp,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "library_settings" ADD CONSTRAINT "library_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_settings" ADD CONSTRAINT "library_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;