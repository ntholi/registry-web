CREATE TABLE "application_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"overall_score" real,
	"first_choice_score" real,
	"second_choice_score" real,
	"calculated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_application_scores_app" UNIQUE("application_id")
);
--> statement-breakpoint
ALTER TABLE "application_scores" ADD CONSTRAINT "application_scores_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_application_scores_app" ON "application_scores" USING btree ("application_id");