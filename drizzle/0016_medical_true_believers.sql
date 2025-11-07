ALTER TABLE "student_semesters" ADD COLUMN "sponsor_id" integer;--> statement-breakpoint
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_student_semesters_sponsor_id" ON "student_semesters" USING btree ("sponsor_id");--> statement-breakpoint

UPDATE student_semesters
SET sponsor_id = sp_st.sponsor_id
FROM student_programs sp,
     terms t,
     registration_requests rr,
     sponsored_students sp_st
WHERE student_semesters.student_program_id = sp.id
  AND student_semesters.term = t.name
  AND rr.std_no = sp.std_no
  AND rr.term_id = t.id
  AND sp_st.id = rr.sponsored_student_id;