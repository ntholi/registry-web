CREATE TABLE "feedback_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"passphrase_id" integer NOT NULL,
	"assigned_module_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "feedback_responses_passphraseId_assignedModuleId_questionId_unique" UNIQUE("passphrase_id","assigned_module_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "feedback_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback_passphrases" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_id" integer NOT NULL,
	"structure_semester_id" integer NOT NULL,
	"passphrase" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "feedback_passphrases_passphrase_unique" UNIQUE("passphrase")
);
--> statement-breakpoint
CREATE TABLE "feedback_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"term_id" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"text" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_passphrase_id_feedback_passphrases_id_fk" FOREIGN KEY ("passphrase_id") REFERENCES "public"."feedback_passphrases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_assigned_module_id_assigned_modules_id_fk" FOREIGN KEY ("assigned_module_id") REFERENCES "public"."assigned_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_question_id_feedback_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."feedback_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_passphrases" ADD CONSTRAINT "feedback_passphrases_period_id_feedback_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."feedback_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_passphrases" ADD CONSTRAINT "feedback_passphrases_structure_semester_id_structure_semesters_id_fk" FOREIGN KEY ("structure_semester_id") REFERENCES "public"."structure_semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_periods" ADD CONSTRAINT "feedback_periods_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_questions" ADD CONSTRAINT "feedback_questions_category_id_feedback_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."feedback_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_passphrases_passphrase" ON "feedback_passphrases" USING btree ("passphrase");--> statement-breakpoint
CREATE INDEX "idx_feedback_passphrases_period_class" ON "feedback_passphrases" USING btree ("period_id","structure_semester_id");