-- Backfill std_no and changed_by_role for existing audit_logs records --

-- 1. Backfill changed_by_role from users table
UPDATE audit_logs al
SET changed_by_role = u.role
FROM users u
WHERE al.changed_by = u.id
  AND al.changed_by_role IS NULL;

-- 2. Direct tables: students (record_id = std_no)
UPDATE audit_logs
SET std_no = record_id::bigint
WHERE table_name = 'students'
  AND std_no IS NULL;

-- 3. Direct tables: student_programs
UPDATE audit_logs al
SET std_no = sp.std_no
FROM student_programs sp
WHERE al.table_name = 'student_programs'
  AND al.record_id = sp.id::text
  AND al.std_no IS NULL;

-- 4. Direct tables: payment_receipts
UPDATE audit_logs al
SET std_no = pr.std_no
FROM payment_receipts pr
WHERE al.table_name = 'payment_receipts'
  AND al.record_id = pr.id::text
  AND al.std_no IS NULL;

-- 5. Direct tables: blocked_students
UPDATE audit_logs al
SET std_no = t.std_no
FROM blocked_students t
WHERE al.table_name = 'blocked_students'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 6. Direct tables: student_documents
UPDATE audit_logs al
SET std_no = t.std_no
FROM student_documents t
WHERE al.table_name = 'student_documents'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 7. Direct tables: registration_requests
UPDATE audit_logs al
SET std_no = t.std_no
FROM registration_requests t
WHERE al.table_name = 'registration_requests'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 8. Direct tables: sponsored_students
UPDATE audit_logs al
SET std_no = t.std_no
FROM sponsored_students t
WHERE al.table_name = 'sponsored_students'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 9. Direct tables: attendance
UPDATE audit_logs al
SET std_no = t.std_no
FROM attendance t
WHERE al.table_name = 'attendance'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 10. Direct tables: loans
UPDATE audit_logs al
SET std_no = t.std_no
FROM loans t
WHERE al.table_name = 'loans'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 11. Direct tables: fines
UPDATE audit_logs al
SET std_no = t.std_no
FROM fines t
WHERE al.table_name = 'fines'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 12. Direct tables: transcript_prints
UPDATE audit_logs al
SET std_no = t.std_no
FROM transcript_prints t
WHERE al.table_name = 'transcript_prints'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 13. Direct tables: statement_of_results_prints
UPDATE audit_logs al
SET std_no = t.std_no
FROM statement_of_results_prints t
WHERE al.table_name = 'statement_of_results_prints'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 14. Direct tables: student_card_prints
UPDATE audit_logs al
SET std_no = t.std_no
FROM student_card_prints t
WHERE al.table_name = 'student_card_prints'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 15. Direct tables: certificate_reprints
UPDATE audit_logs al
SET std_no = t.std_no
FROM certificate_reprints t
WHERE al.table_name = 'certificate_reprints'
  AND al.record_id = t.id::text
  AND al.std_no IS NULL;

-- 16. 1-hop: student_semesters (via student_program_id -> student_programs.std_no)
UPDATE audit_logs al
SET std_no = sp.std_no
FROM student_semesters ss
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE al.table_name = 'student_semesters'
  AND al.record_id = ss.id::text
  AND al.std_no IS NULL;

-- 17. 2-hop: student_modules (via student_semester_id -> student_semesters -> student_programs.std_no)
UPDATE audit_logs al
SET std_no = sp.std_no
FROM student_modules sm
JOIN student_semesters ss ON sm.student_semester_id = ss.id
JOIN student_programs sp ON ss.student_program_id = sp.id
WHERE al.table_name = 'student_modules'
  AND al.record_id = sm.id::text
  AND al.std_no IS NULL;

-- 18. 3-hop: assessment_marks (via student_module_id -> student_modules -> student_semesters -> student_programs.std_no)
-- Batched approach for ~218K rows
UPDATE audit_logs al
SET std_no = sub.std_no
FROM (
  SELECT al2.id, sp2.std_no
  FROM audit_logs al2
  JOIN assessment_marks am ON al2.record_id = am.id::text
  JOIN student_modules sm ON am.student_module_id = sm.id
  JOIN student_semesters ss ON sm.student_semester_id = ss.id
  JOIN student_programs sp2 ON ss.student_program_id = sp2.id
  WHERE al2.table_name = 'assessment_marks'
    AND al2.std_no IS NULL
) sub
WHERE al.id = sub.id;

-- 19. 3-hop: clearance via registration_clearance (registration path)
UPDATE audit_logs al
SET std_no = rr.std_no
FROM registration_clearance rc
JOIN registration_requests rr ON rc.registration_request_id = rr.id
WHERE al.table_name = 'clearance'
  AND al.record_id = rc.clearance_id::text
  AND al.std_no IS NULL;

-- 20. 3-hop: clearance via graduation_clearance (graduation path)
UPDATE audit_logs al
SET std_no = sp.std_no
FROM graduation_clearance gc
JOIN graduation_requests gr ON gc.graduation_request_id = gr.id
JOIN student_programs sp ON gr.student_program_id = sp.id
WHERE al.table_name = 'clearance'
  AND al.record_id = gc.clearance_id::text
  AND al.std_no IS NULL;

-- 21. Fallback: extract std_no from JSONB old_values/new_values for orphaned records
UPDATE audit_logs
SET std_no = COALESCE(
  (new_values->>'stdNo')::bigint,
  (old_values->>'stdNo')::bigint,
  (new_values->>'std_no')::bigint,
  (old_values->>'std_no')::bigint
)
WHERE std_no IS NULL
  AND table_name IN ('students', 'student_programs', 'payment_receipts', 'blocked_students',
    'student_documents', 'registration_requests', 'sponsored_students', 'attendance',
    'loans', 'fines', 'transcript_prints', 'statement_of_results_prints',
    'student_card_prints', 'certificate_reprints')
  AND (
    (new_values->>'stdNo') IS NOT NULL OR
    (old_values->>'stdNo') IS NOT NULL OR
    (new_values->>'std_no') IS NOT NULL OR
    (old_values->>'std_no') IS NOT NULL
  );