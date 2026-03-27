-- Add 'verified' to payment_status enum (via catalog insert for transaction safety)
INSERT INTO pg_enum (oid, enumtypid, enumlabel, enumsortorder)
SELECT ((SELECT MAX(oid)::int FROM pg_enum) + 1)::oid,
       t.oid,
       'verified',
       (SELECT MAX(e.enumsortorder) + 1 FROM pg_enum e WHERE e.enumtypid = t.oid)
FROM pg_type t
WHERE t.typname = 'payment_status'
  AND t.typnamespace = 'public'::regnamespace
  AND NOT EXISTS (
    SELECT 1 FROM pg_enum e WHERE e.enumtypid = t.oid AND e.enumlabel = 'verified'
  );
--> statement-breakpoint

-- Migrate existing 'paid' records to 'verified' (these were set after finance verification in the old flow)
UPDATE "applications" SET "payment_status" = 'verified' WHERE "payment_status" = 'paid';
--> statement-breakpoint

-- Mark applications as 'paid' where they have any pending/verified deposit but were left as 'unpaid'
UPDATE "applications" SET "payment_status" = 'paid'
WHERE "payment_status" = 'unpaid'
AND (
    EXISTS (SELECT 1 FROM "bank_deposits" WHERE "bank_deposits"."application_id" = "applications"."id" AND "bank_deposits"."status" IN ('pending', 'verified'))
    OR EXISTS (SELECT 1 FROM "mobile_deposits" WHERE "mobile_deposits"."application_id" = "applications"."id" AND "mobile_deposits"."status" IN ('pending', 'verified'))
);