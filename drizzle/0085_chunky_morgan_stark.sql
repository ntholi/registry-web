CREATE TABLE "subject_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subject_aliases_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
ALTER TABLE "subject_aliases" ADD CONSTRAINT "subject_aliases_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;