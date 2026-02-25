# 004 — Historical Migration Plan (Fine-Grain Backfill)

## Objective
Migrate already-written `audit_logs` rows from coarse or incorrect activity types to the new fine-grain taxonomy, without losing forensic integrity.

## Feasibility
Historical migration is **possible**, with clear limits:
1. **Deterministic remaps** are safe where `table_name`, `operation`, and legacy `activity_type` uniquely imply the target type.
2. **Inference-based remaps** are safe only when `old_values` vs `new_values` indicate one clear intent.
3. Some events cannot be reconstructed if historical rows never captured enough signal.

## Current DB evidence (this environment)
- `audit_logs` total rows: `253090`
- `activity_type IS NULL`: `0`
- Known problematic rows currently observed: `task_updated = 9`
- For sampled `task_updated` rows, changed keys distribution:
  - `{status,updatedAt}`: 7
  - `{completedAt,status,updatedAt}`: 1
  - `{updatedAt}`: 1

Implication: status-change remap is mostly deterministic for historical task updates; one row is ambiguous (`updatedAt` only).

## Preconditions (must be completed first)
1. New activity types are already added to the catalog.
2. Emission code paths are already updated to write fine-grain activity types going forward.
3. `003_implementation-validation-and-rollout.md` Phase 6 validation is complete.

## Migration principles
1. Use module-by-module batches.
2. Run dry-run count queries before every `UPDATE`.
3. Execute each batch inside a transaction.
4. Keep non-overlapping predicates; do not double-map a row.
5. Keep any ambiguous rows unchanged rather than guessing.

## Execution plan

### Step 1: Backup and guardrails
```sql
create table if not exists audit_logs_backup_all as
select * from audit_logs;
```

Optional module-scoped backups for faster rollback:
```sql
create table if not exists audit_logs_backup_tasks as
select * from audit_logs where table_name = 'tasks';
```

### Step 2: Deterministic remaps
```sql
-- Task deletes previously misclassified
update audit_logs
set activity_type = 'task_deleted'
where table_name = 'tasks'
  and operation = 'DELETE'
  and activity_type = 'task_updated';

-- Notification deletes previously misclassified
update audit_logs
set activity_type = 'notification_deleted'
where table_name = 'notifications'
  and operation = 'DELETE'
  and activity_type = 'notification_updated';

-- Sponsor deletes previously misclassified
update audit_logs
set activity_type = 'sponsor_deleted'
where table_name = 'sponsors'
  and operation = 'DELETE'
  and activity_type = 'sponsor_updated';

-- Certificate reprint coarse label split by operation
update audit_logs
set activity_type = 'certificate_reprint_created'
where table_name = 'certificate_reprints'
  and operation = 'INSERT'
  and activity_type = 'certificate_reprint';

update audit_logs
set activity_type = 'certificate_reprint_updated'
where table_name = 'certificate_reprints'
  and operation = 'UPDATE'
  and activity_type = 'certificate_reprint';

update audit_logs
set activity_type = 'certificate_reprint_deleted'
where table_name = 'certificate_reprints'
  and operation = 'DELETE'
  and activity_type = 'certificate_reprint';

-- Non-cataloged historical label normalization
update audit_logs
set activity_type = 'student_program_structure_changed'
where activity_type = 'program_structure_update';
```

### Step 3: Inference-based remaps (strict predicates only)
```sql
-- task_status_changed
update audit_logs
set activity_type = 'task_status_changed'
where table_name = 'tasks'
  and operation = 'UPDATE'
  and activity_type = 'task_updated'
  and old_values is not null
  and new_values is not null
  and (old_values -> 'status') is distinct from (new_values -> 'status');

-- task_priority_changed (status and dueDate unchanged)
update audit_logs
set activity_type = 'task_priority_changed'
where table_name = 'tasks'
  and operation = 'UPDATE'
  and activity_type = 'task_updated'
  and old_values is not null
  and new_values is not null
  and (old_values -> 'priority') is distinct from (new_values -> 'priority')
  and (old_values -> 'status') is not distinct from (new_values -> 'status')
  and (old_values -> 'dueDate') is not distinct from (new_values -> 'dueDate');

-- task_due_date_changed (status and priority unchanged)
update audit_logs
set activity_type = 'task_due_date_changed'
where table_name = 'tasks'
  and operation = 'UPDATE'
  and activity_type = 'task_updated'
  and old_values is not null
  and new_values is not null
  and (old_values -> 'dueDate') is distinct from (new_values -> 'dueDate')
  and (old_values -> 'status') is not distinct from (new_values -> 'status')
  and (old_values -> 'priority') is not distinct from (new_values -> 'priority');
```

### Step 4: Optional null backfill (for environments that still have nulls)
```sql
update audit_logs set activity_type = 'venue_deleted'
where table_name = 'venues' and operation = 'DELETE' and activity_type is null;

update audit_logs set activity_type = 'venue_type_deleted'
where table_name = 'venue_types' and operation = 'DELETE' and activity_type is null;

update audit_logs set activity_type = 'application_deleted'
where table_name = 'applications' and operation = 'DELETE' and activity_type is null;

update audit_logs set activity_type = 'feedback_category_deleted'
where table_name = 'feedback_categories' and operation = 'DELETE' and activity_type is null;

update audit_logs set activity_type = 'feedback_cycle_deleted'
where table_name = 'feedback_cycles' and operation = 'DELETE' and activity_type is null;

update audit_logs set activity_type = 'feedback_question_deleted'
where table_name = 'feedback_questions' and operation = 'DELETE' and activity_type is null;

update audit_logs set activity_type = 'graduation_date_deleted'
where table_name = 'graduation_dates' and operation = 'DELETE' and activity_type is null;
```

## Dry-run checks (run before each update block)
```sql
-- Example: candidates for status remap
select count(*)
from audit_logs
where table_name = 'tasks'
  and operation = 'UPDATE'
  and activity_type = 'task_updated'
  and (old_values -> 'status') is distinct from (new_values -> 'status');

-- Remaining ambiguous task_updated rows
select count(*)
from audit_logs
where table_name = 'tasks'
  and operation = 'UPDATE'
  and activity_type = 'task_updated';

-- Null activity check
select table_name, operation, count(*)
from audit_logs
where activity_type is null
group by 1,2
order by count(*) desc;
```

## Rollback
Full rollback:
```sql
delete from audit_logs;
insert into audit_logs select * from audit_logs_backup_all;
```

Module rollback (tasks example):
```sql
delete from audit_logs where table_name = 'tasks';
insert into audit_logs
select * from audit_logs_backup_tasks;
```

## Success criteria
1. No non-cataloged `activity_type` values remain.
2. No deterministic misclassification patterns remain.
3. Ambiguous rows are explicitly tracked and left unchanged (no guessed remaps).
4. Analytics trend continuity is validated before and after migration.

## Out-of-scope reconstruction
The migration does not fabricate events never emitted historically (for example sponsorship operations if no audit rows were written). Those gaps are fixed only for future writes by service/repository changes.
