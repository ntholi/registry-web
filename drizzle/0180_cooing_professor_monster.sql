ALTER TABLE "student_statuses" ALTER COLUMN "term_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_statuses" ADD COLUMN "term_id" integer;--> statement-breakpoint
UPDATE "student_statuses" ss SET "term_id" = t.id FROM "terms" t WHERE t.code = ss.term_code;--> statement-breakpoint
ALTER TABLE "student_statuses" ADD CONSTRAINT "student_statuses_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_student_statuses_term_id" ON "student_statuses" USING btree ("term_id");