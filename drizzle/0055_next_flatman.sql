ALTER TABLE "student_semesters" RENAME COLUMN "term" TO "term_code";--> statement-breakpoint
DROP INDEX "idx_student_semesters_term";--> statement-breakpoint
CREATE INDEX "idx_student_semesters_term" ON "student_semesters" USING btree ("term_code");