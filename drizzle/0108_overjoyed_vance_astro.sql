CREATE SEQUENCE IF NOT EXISTS application_id_seq START WITH 100001;
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "id" SET DEFAULT nextval('application_id_seq')::text;