ALTER TABLE "registration_requests" ADD COLUMN "sponsored_student_id" integer;--> statement-breakpoint

UPDATE "registration_requests" rr
SET "sponsored_student_id" = (
  SELECT ss.id
  FROM "sponsored_students" ss
  WHERE ss.sponsor_id = rr.sponsor_id
    AND ss.std_no = rr.std_no
  LIMIT 1
);--> statement-breakpoint

UPDATE "registration_requests" rr
SET "sponsored_student_id" = (
  SELECT ss.id
  FROM "sponsored_students" ss
  WHERE ss.std_no = rr.std_no
  LIMIT 1
)
WHERE "sponsored_student_id" IS NULL;--> statement-breakpoint

ALTER TABLE "registration_requests" ALTER COLUMN "sponsored_student_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "registration_requests" DROP CONSTRAINT "registration_requests_sponsor_id_sponsors_id_fk";--> statement-breakpoint

DROP INDEX IF EXISTS "fk_registration_requests_sponsor_id";--> statement-breakpoint

ALTER TABLE "registration_requests" DROP COLUMN IF EXISTS "sponsor_id";--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_sponsored_student_id_sponsored_students_id_fk" FOREIGN KEY ("sponsored_student_id") REFERENCES "public"."sponsored_students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "fk_registration_requests_sponsored_student_id" ON "registration_requests" USING btree ("sponsored_student_id");
