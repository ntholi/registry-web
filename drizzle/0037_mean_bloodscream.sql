ALTER TABLE "assigned_modules" ADD COLUMN "classroom_course_id" text;--> statement-breakpoint
CREATE INDEX "idx_assigned_modules_course_id" ON "assigned_modules" USING btree ("classroom_course_id");