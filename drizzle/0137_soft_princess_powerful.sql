ALTER TABLE "student_semesters" DROP CONSTRAINT "student_semesters_registration_request_id_registration_requests_id_fk";
--> statement-breakpoint
DROP INDEX "unique_registration_requests_active";--> statement-breakpoint
DROP INDEX "fk_student_semesters_registration_request_id";--> statement-breakpoint
ALTER TABLE "registration_requests" ADD COLUMN "student_semester_id" integer;--> statement-breakpoint
-- Migrate data: populate student_semester_id from the old relationship
UPDATE "registration_requests" rr
SET "student_semester_id" = ss.id
FROM "student_semesters" ss
WHERE ss."registration_request_id" = rr.id;
--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_student_semester_id_student_semesters_id_fk" FOREIGN KEY ("student_semester_id") REFERENCES "public"."student_semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_registration_requests_student_semester_id" ON "registration_requests" USING btree ("student_semester_id");--> statement-breakpoint
ALTER TABLE "student_semesters" DROP COLUMN "registration_request_id";