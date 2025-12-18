ALTER TABLE "terms" RENAME COLUMN "name" TO "code";--> statement-breakpoint
ALTER TABLE "terms" DROP CONSTRAINT "terms_name_unique";--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_code_unique" UNIQUE("code");