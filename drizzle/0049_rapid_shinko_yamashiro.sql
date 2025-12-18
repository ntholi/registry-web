ALTER TABLE "terms" ALTER COLUMN "semester" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "terms" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "terms" ADD COLUMN "start_date" text;--> statement-breakpoint
ALTER TABLE "terms" ADD COLUMN "end_date" text;