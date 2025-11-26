ALTER TABLE "assigned_modules" RENAME COLUMN "classroom_course_id" TO "lms_course_id";--> statement-breakpoint
DROP INDEX "idx_assigned_modules_course_id";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lms_user_id" integer;--> statement-breakpoint
CREATE INDEX "idx_assigned_modules_course_id" ON "assigned_modules" USING btree ("lms_course_id");