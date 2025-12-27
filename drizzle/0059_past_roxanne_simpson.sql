ALTER TABLE "student_semesters" ADD COLUMN "registration_request_id" integer;--> statement-breakpoint
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_registration_request_id_registration_requests_id_fk" FOREIGN KEY ("registration_request_id") REFERENCES "public"."registration_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_student_semesters_registration_request_id" ON "student_semesters" USING btree ("registration_request_id");--> statement-breakpoint
UPDATE "student_semesters" ss
SET "registration_request_id" = rr.id
FROM "registration_requests" rr
INNER JOIN "terms" t ON t.id = rr."term_id"
INNER JOIN "student_programs" sp ON sp."std_no" = rr."std_no"
WHERE rr.status = 'registered'
  AND ss."student_program_id" = sp.id
  AND ss."term_code" = t.code;