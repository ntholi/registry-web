ALTER TABLE "applicants" ADD COLUMN "std_no" bigint;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_applicants_std_no" ON "applicants" USING btree ("std_no");