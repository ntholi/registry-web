-- Migration: Redesign payment_receipts table for broader scope
-- This migration:
-- 1. Creates new receipt_type enum with extended values
-- 2. Transforms payment_receipts to use text IDs and adds stdNo
-- 3. Creates graduation_request_receipts junction table
-- 4. Migrates student_card_prints.receipt_no to reference payment_receipts.id
-- 5. Migrates existing data while preserving integrity

-- Step 1: Create new enum type with extended values
CREATE TYPE "receipt_type" AS ENUM(
    'graduation_gown',
    'graduation_fee',
    'student_card',
    'repeat_modules',
    'late_registration',
    'tuition_fee'
);

-- Step 2: Create temporary table to hold transformed payment_receipts
CREATE TABLE "payment_receipts_new" (
    "id" text PRIMARY KEY,
    "receipt_no" text NOT NULL,
    "receipt_type" "receipt_type" NOT NULL,
    "std_no" bigint NOT NULL REFERENCES "students"("std_no") ON DELETE CASCADE,
    "created_by" text REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now()
);

-- Step 3: Migrate existing payment_receipts data
-- Generate text IDs and get std_no from graduation_requests -> student_programs
INSERT INTO "payment_receipts_new" ("id", "receipt_no", "receipt_type", "std_no", "created_at")
SELECT
    'pr_' || lpad(pr.id::text, 8, '0') as id,
    pr.receipt_no,
    pr.payment_type::text::receipt_type,
    sp.std_no,
    pr.created_at
FROM payment_receipts pr
JOIN graduation_requests gr ON pr.graduation_request_id = gr.id
JOIN student_programs sp ON gr.student_program_id = sp.id;

-- Step 4: Create graduation_request_receipts junction table
CREATE TABLE "graduation_request_receipts" (
    "graduation_request_id" integer NOT NULL REFERENCES "graduation_requests"("id") ON DELETE CASCADE,
    "receipt_id" text NOT NULL,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "graduation_request_receipts_graduation_request_id_receipt_id_unique" UNIQUE("graduation_request_id", "receipt_id")
);

-- Step 5: Populate junction table
INSERT INTO "graduation_request_receipts" ("graduation_request_id", "receipt_id", "created_at")
SELECT
    pr.graduation_request_id,
    'pr_' || lpad(pr.id::text, 8, '0'),
    pr.created_at
FROM payment_receipts pr;

-- Step 6: Create payment receipts for student_card_prints
-- This creates new receipt entries for each student card print
INSERT INTO "payment_receipts_new" ("id", "receipt_no", "receipt_type", "std_no", "created_at")
SELECT
    'sc_' || scp.id as id,
    scp.receipt_no,
    'student_card'::receipt_type,
    scp.std_no,
    scp.created_at
FROM student_card_prints scp;

-- Step 7: Add foreign key reference to payment_receipts_new from graduation_request_receipts
ALTER TABLE "graduation_request_receipts"
ADD CONSTRAINT "graduation_request_receipts_receipt_id_payment_receipts_id_fk"
FOREIGN KEY ("receipt_id") REFERENCES "payment_receipts_new"("id") ON DELETE CASCADE;

-- Step 8: Add receipt_id column to student_card_prints
ALTER TABLE "student_card_prints" ADD COLUMN "receipt_id_new" text;

-- Step 9: Populate receipt_id_new in student_card_prints
UPDATE "student_card_prints" SET "receipt_id_new" = 'sc_' || id;

-- Step 10: Make receipt_id_new NOT NULL and add FK
ALTER TABLE "student_card_prints"
ALTER COLUMN "receipt_id_new" SET NOT NULL;

ALTER TABLE "student_card_prints"
ADD CONSTRAINT "student_card_prints_receipt_id_payment_receipts_id_fk"
FOREIGN KEY ("receipt_id_new") REFERENCES "payment_receipts_new"("id") ON DELETE CASCADE;

-- Step 11: Drop old columns and constraints from student_card_prints
ALTER TABLE "student_card_prints" DROP CONSTRAINT IF EXISTS "student_card_prints_receiptNo_unique";
ALTER TABLE "student_card_prints" DROP COLUMN "receipt_no";
ALTER TABLE "student_card_prints" RENAME COLUMN "receipt_id_new" TO "receipt_id";

-- Step 12: Create indexes for new receipt_id column
CREATE INDEX "fk_student_card_prints_receipt_id" ON "student_card_prints" ("receipt_id");

-- Step 13: Drop old payment_receipts table
DROP TABLE "payment_receipts";

-- Step 14: Rename new table
ALTER TABLE "payment_receipts_new" RENAME TO "payment_receipts";

-- Step 15: Create indexes on payment_receipts
CREATE UNIQUE INDEX "payment_receipts_receipt_no_unique" ON "payment_receipts" ("receipt_no");
CREATE INDEX "fk_payment_receipts_std_no" ON "payment_receipts" ("std_no");
CREATE INDEX "idx_payment_receipts_receipt_type" ON "payment_receipts" ("receipt_type");

-- Step 16: Create index on graduation_request_receipts
CREATE INDEX "fk_graduation_request_receipts_graduation_request_id" ON "graduation_request_receipts" ("graduation_request_id");

-- Step 17: Drop old payment_type enum
DROP TYPE "payment_type";