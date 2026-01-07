ALTER TABLE "graduations" RENAME TO "graduation_dates";--> statement-breakpoint
ALTER TABLE "graduation_dates" DROP CONSTRAINT "graduations_term_id_terms_id_fk";
--> statement-breakpoint
ALTER TABLE "graduation_dates" ADD CONSTRAINT "graduation_dates_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;