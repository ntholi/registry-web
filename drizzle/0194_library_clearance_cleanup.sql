-- Phase 6a: Delete pending Library clearance rows
CREATE TEMP TABLE _pending_lib AS
  SELECT id FROM clearance WHERE department = 'library' AND status = 'pending';

DELETE FROM registration_clearance WHERE clearance_id IN (SELECT id FROM _pending_lib);
DELETE FROM graduation_clearance     WHERE clearance_id IN (SELECT id FROM _pending_lib);

DELETE FROM clearance WHERE id IN (SELECT id FROM _pending_lib);

DROP TABLE _pending_lib;

-- Phase 6b: Migrate library-rejected students to blocked_students
INSERT INTO blocked_students (std_no, reason, by_department, status, created_at)
SELECT DISTINCT ON (all_rej.std_no)
  all_rej.std_no,
  COALESCE(all_rej.message, 'Library clearance rejected'),
  'registry',
  'blocked',
  NOW()
FROM (
  SELECT rr.std_no, c.message, c.response_date
    FROM clearance c
    JOIN registration_clearance rc ON rc.clearance_id = c.id
    JOIN registration_requests rr  ON rr.id = rc.registration_request_id
   WHERE c.department = 'library' AND c.status = 'rejected'
  UNION ALL
  SELECT sp.std_no, c.message, c.response_date
    FROM clearance c
    JOIN graduation_clearance gc ON gc.clearance_id = c.id
    JOIN graduation_requests gr   ON gr.id = gc.graduation_request_id
    JOIN student_programs sp      ON sp.id = gr.student_program_id
   WHERE c.department = 'library' AND c.status = 'rejected'
) AS all_rej
WHERE NOT EXISTS (
  SELECT 1 FROM blocked_students bs
   WHERE bs.std_no = all_rej.std_no
)
ORDER BY all_rej.std_no, all_rej.response_date DESC NULLS LAST;

-- Phase 6c: Drop emailSent column from clearance table
ALTER TABLE clearance DROP COLUMN IF EXISTS email_sent;

-- Phase 6d: Delete orphaned Library auto-approval records
DELETE FROM auto_approvals WHERE department = 'library';

-- Phase 6e: Remove clearance grants from Library and Resource permission presets
DELETE FROM preset_permissions
WHERE preset_id IN (
  SELECT id FROM permission_presets WHERE role IN ('library', 'resource')
)
AND resource IN ('registration-clearance', 'graduation-clearance', 'auto-approvals');