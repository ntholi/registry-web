-- 004: Historical Migration — Fine-Grain Activity Type Backfill
-- Migrates coarse/incorrect audit_logs activity_type values to the new fine-grain taxonomy.
-- See docs/activity-logs/04-activity-logging-fine-grain/004_historical-migration-plan.md

------------------------------------------------------------------------
-- Step 1: Backup
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs_backup_all AS
SELECT * FROM audit_logs;

CREATE TABLE IF NOT EXISTS audit_logs_backup_tasks AS
SELECT * FROM audit_logs WHERE table_name = 'tasks';

CREATE TABLE IF NOT EXISTS audit_logs_backup_notifications AS
SELECT * FROM audit_logs WHERE table_name = 'notifications';

CREATE TABLE IF NOT EXISTS audit_logs_backup_sponsors AS
SELECT * FROM audit_logs WHERE table_name = 'sponsors';

CREATE TABLE IF NOT EXISTS audit_logs_backup_certificate_reprints AS
SELECT * FROM audit_logs WHERE table_name = 'certificate_reprints';

------------------------------------------------------------------------
-- Step 2: Deterministic remaps
------------------------------------------------------------------------

-- Task deletes previously misclassified
UPDATE audit_logs
SET activity_type = 'task_deleted'
WHERE table_name = 'tasks'
  AND operation = 'DELETE'
  AND activity_type = 'task_updated';

-- Notification deletes previously misclassified
UPDATE audit_logs
SET activity_type = 'notification_deleted'
WHERE table_name = 'notifications'
  AND operation = 'DELETE'
  AND activity_type = 'notification_updated';

-- Sponsor deletes previously misclassified
UPDATE audit_logs
SET activity_type = 'sponsor_deleted'
WHERE table_name = 'sponsors'
  AND operation = 'DELETE'
  AND activity_type = 'sponsor_updated';

-- Certificate reprint coarse label split by operation
UPDATE audit_logs
SET activity_type = 'certificate_reprint_created'
WHERE table_name = 'certificate_reprints'
  AND operation = 'INSERT'
  AND activity_type = 'certificate_reprint';

UPDATE audit_logs
SET activity_type = 'certificate_reprint_updated'
WHERE table_name = 'certificate_reprints'
  AND operation = 'UPDATE'
  AND activity_type = 'certificate_reprint';

UPDATE audit_logs
SET activity_type = 'certificate_reprint_deleted'
WHERE table_name = 'certificate_reprints'
  AND operation = 'DELETE'
  AND activity_type = 'certificate_reprint';

-- Non-cataloged historical label normalization
UPDATE audit_logs
SET activity_type = 'student_program_structure_changed'
WHERE activity_type = 'program_structure_update';

------------------------------------------------------------------------
-- Step 3: Inference-based remaps (strict predicates only)
------------------------------------------------------------------------

-- task_status_changed
UPDATE audit_logs
SET activity_type = 'task_status_changed'
WHERE table_name = 'tasks'
  AND operation = 'UPDATE'
  AND activity_type = 'task_updated'
  AND old_values IS NOT NULL
  AND new_values IS NOT NULL
  AND (old_values -> 'status') IS DISTINCT FROM (new_values -> 'status');

-- task_priority_changed (status and dueDate unchanged)
UPDATE audit_logs
SET activity_type = 'task_priority_changed'
WHERE table_name = 'tasks'
  AND operation = 'UPDATE'
  AND activity_type = 'task_updated'
  AND old_values IS NOT NULL
  AND new_values IS NOT NULL
  AND (old_values -> 'priority') IS DISTINCT FROM (new_values -> 'priority')
  AND (old_values -> 'status') IS NOT DISTINCT FROM (new_values -> 'status')
  AND (old_values -> 'dueDate') IS NOT DISTINCT FROM (new_values -> 'dueDate');

-- task_due_date_changed (status and priority unchanged)
UPDATE audit_logs
SET activity_type = 'task_due_date_changed'
WHERE table_name = 'tasks'
  AND operation = 'UPDATE'
  AND activity_type = 'task_updated'
  AND old_values IS NOT NULL
  AND new_values IS NOT NULL
  AND (old_values -> 'dueDate') IS DISTINCT FROM (new_values -> 'dueDate')
  AND (old_values -> 'status') IS NOT DISTINCT FROM (new_values -> 'status')
  AND (old_values -> 'priority') IS NOT DISTINCT FROM (new_values -> 'priority');

------------------------------------------------------------------------
-- Step 4: Optional null backfill
------------------------------------------------------------------------

UPDATE audit_logs SET activity_type = 'venue_deleted'
WHERE table_name = 'venues' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'venue_type_deleted'
WHERE table_name = 'venue_types' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'application_deleted'
WHERE table_name = 'applications' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'feedback_category_deleted'
WHERE table_name = 'feedback_categories' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'feedback_cycle_deleted'
WHERE table_name = 'feedback_cycles' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'feedback_question_deleted'
WHERE table_name = 'feedback_questions' AND operation = 'DELETE' AND activity_type IS NULL;

UPDATE audit_logs SET activity_type = 'graduation_date_deleted'
WHERE table_name = 'graduation_dates' AND operation = 'DELETE' AND activity_type IS NULL;