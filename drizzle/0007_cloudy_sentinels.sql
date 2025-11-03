ALTER TABLE "student_education" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_education" ALTER COLUMN "level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_education" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_education" ALTER COLUMN "end_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_education" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "student_education" ADD COLUMN "school_name" text NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_student_education_school_name" ON "student_education" USING btree ("school_name");