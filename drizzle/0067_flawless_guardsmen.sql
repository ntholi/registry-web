ALTER TABLE "graduation_requests" DROP CONSTRAINT "graduation_requests_graduation_date_id_graduation_dates_id_fk";
--> statement-breakpoint
ALTER TABLE "graduation_requests" ALTER COLUMN "graduation_date_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "graduation_requests" ADD CONSTRAINT "graduation_requests_graduation_date_id_graduation_dates_id_fk" FOREIGN KEY ("graduation_date_id") REFERENCES "public"."graduation_dates"("id") ON DELETE restrict ON UPDATE no action;