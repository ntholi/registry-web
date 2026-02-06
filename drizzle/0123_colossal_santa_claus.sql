CREATE TABLE "term_registration_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"term_registration_id" integer NOT NULL,
	"program_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "term_registration_programs_termRegistrationId_programId_unique" UNIQUE("term_registration_id","program_id")
);
--> statement-breakpoint
CREATE TABLE "term_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"term_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" text,
	CONSTRAINT "term_registrations_termId_schoolId_unique" UNIQUE("term_id","school_id")
);
--> statement-breakpoint
ALTER TABLE "term_registration_programs" ADD CONSTRAINT "term_registration_programs_term_registration_id_term_registrations_id_fk" FOREIGN KEY ("term_registration_id") REFERENCES "public"."term_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_registration_programs" ADD CONSTRAINT "term_registration_programs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_registrations" ADD CONSTRAINT "term_registrations_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_registrations" ADD CONSTRAINT "term_registrations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_registrations" ADD CONSTRAINT "term_registrations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_term_registration_programs_term_registration_id" ON "term_registration_programs" USING btree ("term_registration_id");--> statement-breakpoint
CREATE INDEX "fk_term_registration_programs_program_id" ON "term_registration_programs" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "fk_term_registrations_term_id" ON "term_registrations" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "fk_term_registrations_school_id" ON "term_registrations" USING btree ("school_id");--> statement-breakpoint
ALTER TABLE "term_settings" DROP COLUMN "registration_start_date";--> statement-breakpoint
ALTER TABLE "term_settings" DROP COLUMN "registration_end_date";