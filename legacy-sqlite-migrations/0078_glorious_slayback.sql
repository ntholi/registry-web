-- Step 1: Create backup table for graduation_requests
CREATE TABLE IF NOT EXISTS graduation_requests_backup AS SELECT * FROM graduation_requests WHERE 1=0;--> statement-breakpoint
-- Step 2: Back up existing data if std_no column still exists  
INSERT OR IGNORE INTO graduation_requests_backup SELECT * FROM graduation_requests WHERE EXISTS (SELECT 1 FROM pragma_table_info('graduation_requests') WHERE name = 'std_no');--> statement-breakpoint
-- Step 3: Create backup table for graduation_clearance
CREATE TABLE IF NOT EXISTS graduation_clearance_backup AS SELECT * FROM graduation_clearance WHERE 1=0;--> statement-breakpoint
-- Step 4: Back up graduation_clearance data
INSERT OR IGNORE INTO graduation_clearance_backup SELECT * FROM graduation_clearance;--> statement-breakpoint
-- Step 5: Create backup table for payment_receipts  
CREATE TABLE IF NOT EXISTS payment_receipts_backup AS SELECT * FROM payment_receipts WHERE 1=0;--> statement-breakpoint
-- Step 6: Back up payment_receipts data
INSERT OR IGNORE INTO payment_receipts_backup SELECT * FROM payment_receipts;--> statement-breakpoint
-- Step 7: Drop existing graduation_clearance table
DROP TABLE IF EXISTS graduation_clearance;--> statement-breakpoint
-- Step 8: Drop existing payment_receipts table
DROP TABLE IF EXISTS payment_receipts;--> statement-breakpoint
-- Step 9: Drop existing graduation_requests table
DROP TABLE IF EXISTS graduation_requests;--> statement-breakpoint
-- Step 10: Create new graduation_requests table with correct structure
CREATE TABLE graduation_requests (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, student_program_id INTEGER NOT NULL, information_confirmed INTEGER DEFAULT false NOT NULL, message TEXT, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER, FOREIGN KEY (student_program_id) REFERENCES student_programs(id) ON DELETE CASCADE);--> statement-breakpoint
-- Step 11: Migrate graduation_requests data using complex business logic
INSERT OR REPLACE INTO graduation_requests (id, student_program_id, information_confirmed, message, created_at, updated_at) SELECT b.id, COALESCE((SELECT sp.id FROM student_programs sp INNER JOIN student_semesters ss ON ss.student_program_id = sp.id WHERE sp.std_no = b.std_no AND sp.status = 'Completed' AND ss.term IN ('2025-02', '2024-07', '2024-02') LIMIT 1), (SELECT sp.id FROM student_programs sp WHERE sp.std_no = b.std_no AND sp.status = 'Active' LIMIT 1), (SELECT sp.id FROM student_programs sp WHERE sp.std_no = b.std_no ORDER BY CASE sp.status WHEN 'Completed' THEN 1 WHEN 'Active' THEN 2 ELSE 3 END, sp.id LIMIT 1)) as student_program_id, b.information_confirmed, b.message, b.created_at, b.updated_at FROM graduation_requests_backup b WHERE EXISTS (SELECT 1 FROM student_programs sp WHERE sp.std_no = b.std_no);--> statement-breakpoint
-- Step 12: Create unique index for graduation_requests
CREATE UNIQUE INDEX graduation_requests_studentProgramId_unique ON graduation_requests (student_program_id);--> statement-breakpoint
-- Step 13: Recreate graduation_clearance table
CREATE TABLE graduation_clearance (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, graduation_request_id INTEGER NOT NULL, clearance_id INTEGER NOT NULL, created_at INTEGER DEFAULT (unixepoch()), FOREIGN KEY (graduation_request_id) REFERENCES graduation_requests(id) ON DELETE CASCADE, FOREIGN KEY (clearance_id) REFERENCES clearance(id) ON DELETE CASCADE);--> statement-breakpoint
-- Step 14: Migrate graduation_clearance data
INSERT OR REPLACE INTO graduation_clearance SELECT * FROM graduation_clearance_backup WHERE graduation_request_id IN (SELECT id FROM graduation_requests);--> statement-breakpoint
-- Step 15: Create unique index for graduation_clearance
CREATE UNIQUE INDEX graduation_clearance_clearanceId_unique ON graduation_clearance (clearance_id);--> statement-breakpoint
-- Step 16: Recreate payment_receipts table
CREATE TABLE payment_receipts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, graduation_request_id INTEGER NOT NULL, payment_type TEXT NOT NULL, receipt_no TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()), FOREIGN KEY (graduation_request_id) REFERENCES graduation_requests(id) ON DELETE CASCADE);--> statement-breakpoint
-- Step 17: Migrate payment_receipts data
INSERT OR REPLACE INTO payment_receipts SELECT * FROM payment_receipts_backup WHERE graduation_request_id IN (SELECT id FROM graduation_requests);--> statement-breakpoint
-- Step 18: Create unique index for payment_receipts
CREATE UNIQUE INDEX payment_receipts_receiptNo_unique ON payment_receipts (receipt_no);