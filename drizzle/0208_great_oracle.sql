-- Add 'verified' to payment_status enum
ALTER TYPE "public"."payment_status" ADD VALUE IF NOT EXISTS 'verified';

-- Migrate existing 'paid' records to 'verified' (these were set after finance verification in the old flow)
UPDATE "applications" SET "payment_status" = 'verified' WHERE "payment_status" = 'paid';

-- Mark applications as 'paid' where they have any pending/verified deposit but were left as 'unpaid'
UPDATE "applications" SET "payment_status" = 'paid'
WHERE "payment_status" = 'unpaid'
AND (
    EXISTS (SELECT 1 FROM "bank_deposits" WHERE "bank_deposits"."application_id" = "applications"."id" AND "bank_deposits"."status" IN ('pending', 'verified'))
    OR EXISTS (SELECT 1 FROM "mobile_deposits" WHERE "mobile_deposits"."application_id" = "applications"."id" AND "mobile_deposits"."status" IN ('pending', 'verified'))
);