ALTER TABLE "sponsors" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_code_unique" UNIQUE("code");