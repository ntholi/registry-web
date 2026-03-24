DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_status_approvals' AND column_name='message') THEN
    ALTER TABLE "student_status_approvals" RENAME COLUMN "message" TO "comments";
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_statuses' AND column_name='notes') THEN
    ALTER TABLE "student_statuses" RENAME COLUMN "notes" TO "reasons";
  END IF;
END $$;