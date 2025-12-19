CREATE TABLE "graduations" (
	"id" serial PRIMARY KEY NOT NULL,
	"graduation_date" text NOT NULL,
	"term_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "graduations" ADD CONSTRAINT "graduations_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;