ALTER TYPE "public"."payment_status" RENAME TO "payment_status_old";
--> statement-breakpoint

CREATE TYPE "public"."payment_status" AS ENUM ('unpaid', 'paid', 'verified');
--> statement-breakpoint

ALTER TABLE "applications" ALTER COLUMN "payment_status" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "applications"
ALTER COLUMN "payment_status" TYPE "public"."payment_status"
USING ("payment_status"::text::"public"."payment_status");
--> statement-breakpoint

ALTER TABLE "applications" ALTER COLUMN "payment_status" SET DEFAULT 'unpaid';
--> statement-breakpoint

DROP TYPE "public"."payment_status_old";
--> statement-breakpoint

UPDATE "applications" AS a
SET "payment_status" = 'verified'
WHERE a."payment_status" = 'paid'
	 OR EXISTS (
			 SELECT 1
			 FROM "bank_deposits" AS bd
			 WHERE bd."application_id" = a."id"
				 AND bd."status" = 'verified'
	 )
	 OR EXISTS (
			 SELECT 1
			 FROM "mobile_deposits" AS md
			 WHERE md."application_id" = a."id"
				 AND md."status" = 'verified'
	 );
--> statement-breakpoint

UPDATE "applications" AS a
SET "payment_status" = 'paid'
WHERE a."payment_status" = 'unpaid'
	AND (
			EXISTS (
					SELECT 1
					FROM "bank_deposits" AS bd
					WHERE bd."application_id" = a."id"
						AND bd."status" = 'pending'
			)
			OR EXISTS (
					SELECT 1
					FROM "mobile_deposits" AS md
					WHERE md."application_id" = a."id"
						AND md."status" = 'pending'
			)
	);
