CREATE TYPE "public"."activity_type" AS ENUM('quiz', 'assignment', 'lesson', 'forum', 'workshop', 'survey', 'choice', 'feedback', 'scorm');--> statement-breakpoint
CREATE TABLE "lms_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"lms_id" integer NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lms_assessments" ADD CONSTRAINT "lms_assessments_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_lms_assessments_assessment_id" ON "lms_assessments" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "idx_lms_assessments_lms_id" ON "lms_assessments" USING btree ("lms_id");