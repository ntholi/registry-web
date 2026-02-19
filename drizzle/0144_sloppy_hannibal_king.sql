ALTER TABLE "feedback_cycle_schools" DROP CONSTRAINT IF EXISTS "feedback_cycle_schools_cycle_id_feedback_cycles_id_fk";--> statement-breakpoint
ALTER TABLE "feedback_passphrases" DROP CONSTRAINT IF EXISTS "feedback_passphrases_cycle_id_feedback_cycles_id_fk";--> statement-breakpoint
ALTER TABLE "feedback_questions" DROP CONSTRAINT IF EXISTS "feedback_questions_category_id_feedback_categories_id_fk";--> statement-breakpoint
ALTER TABLE "feedback_responses" DROP CONSTRAINT IF EXISTS "feedback_responses_passphrase_id_feedback_passphrases_id_fk";--> statement-breakpoint
ALTER TABLE "feedback_responses" DROP CONSTRAINT IF EXISTS "feedback_responses_question_id_feedback_questions_id_fk";--> statement-breakpoint

ALTER TABLE "feedback_categories" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "feedback_questions" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "feedback_questions" ALTER COLUMN "category_id" SET DATA TYPE text USING "category_id"::text;--> statement-breakpoint
ALTER TABLE "feedback_cycles" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "feedback_passphrases" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "feedback_passphrases" ALTER COLUMN "cycle_id" SET DATA TYPE text USING "cycle_id"::text;--> statement-breakpoint
ALTER TABLE "feedback_cycle_schools" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "feedback_cycle_schools" ALTER COLUMN "cycle_id" SET DATA TYPE text USING "cycle_id"::text;--> statement-breakpoint
ALTER TABLE "feedback_responses" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "feedback_responses" ALTER COLUMN "passphrase_id" SET DATA TYPE text USING "passphrase_id"::text;--> statement-breakpoint
ALTER TABLE "feedback_responses" ALTER COLUMN "question_id" SET DATA TYPE text USING "question_id"::text;--> statement-breakpoint

ALTER TABLE "feedback_cycle_schools" ADD CONSTRAINT "feedback_cycle_schools_cycle_id_feedback_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."feedback_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_passphrases" ADD CONSTRAINT "feedback_passphrases_cycle_id_feedback_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."feedback_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_questions" ADD CONSTRAINT "feedback_questions_category_id_feedback_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."feedback_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_passphrase_id_feedback_passphrases_id_fk" FOREIGN KEY ("passphrase_id") REFERENCES "public"."feedback_passphrases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_question_id_feedback_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."feedback_questions"("id") ON DELETE no action ON UPDATE no action;