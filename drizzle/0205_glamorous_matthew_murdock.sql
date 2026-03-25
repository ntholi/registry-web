-- Seed allowed statuses for letter templates --

-- Semester-status-restricted: Active student required
UPDATE letter_templates SET allowed_semester_statuses = '{Active,Enrolled}'
WHERE id IN (
  'tpl_confirmation_student',
  'tpl_industry_request',
  'tpl_identity_card',
  'tpl_passport',
  'tpl_visa',
  'tpl_bank_request'
);

-- Semester-status-restricted: Deferred
UPDATE letter_templates SET allowed_semester_statuses = '{Deferred}'
WHERE id = 'tpl_deferment';

-- Semester-status-restricted: Withdrawn
UPDATE letter_templates SET allowed_semester_statuses = '{Withdrawn}'
WHERE id = 'tpl_withdrawal';

-- Semester-status-restricted: DroppedOut
UPDATE letter_templates SET allowed_semester_statuses = '{DroppedOut}'
WHERE id = 'tpl_exit_studies';

-- Semester-status-restricted: Reinstatement (student is now active again)
UPDATE letter_templates SET allowed_semester_statuses = '{Active,Enrolled}'
WHERE id = 'tpl_reinstatement';

-- Student-status-restricted: Graduated
UPDATE letter_templates SET allowed_student_statuses = '{Graduated}'
WHERE id IN ('tpl_completion_qual', 'tpl_good_conduct');

-- No restriction (anytime): tpl_change_programme, tpl_english_proficiency, tpl_reference
-- These remain NULL (no update needed)