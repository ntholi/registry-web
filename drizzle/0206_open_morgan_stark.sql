-- Custom SQL migration file, put your code below! --

-- Academic Admin: trim fullCrud to read-only for questions & criteria; add missing read permissions
DELETE FROM preset_permissions
WHERE preset_id = (SELECT id FROM permission_presets WHERE name = 'Academic Admin')
  AND resource IN ('student-feedback-questions', 'teaching-observation-criteria')
  AND action IN ('create', 'update', 'delete');

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-feedback-reports', 'read'),
  ('reports-attendance', 'read'),
  ('reports-boe', 'read'),
  ('reports-enrollments', 'read'),
  ('reports-graduation', 'read')
) AS v(resource, action)
WHERE p.name = 'Academic Admin'
ON CONFLICT (preset_id, resource, action) DO NOTHING;

-- Academic Manager: add full CRUD on letters + read on student-statuses
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('letters', 'read'),
  ('letters', 'create'),
  ('letters', 'update'),
  ('letters', 'delete'),
  ('student-statuses', 'read')
) AS v(resource, action)
WHERE p.name = 'Academic Manager'
ON CONFLICT (preset_id, resource, action) DO NOTHING;

-- Academic Admin: add read on school-structures and student-statuses
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('school-structures', 'read'),
  ('student-statuses', 'read')
) AS v(resource, action)
WHERE p.name = 'Academic Admin'
ON CONFLICT (preset_id, resource, action) DO NOTHING;

-- All presets: add full CRUD on student-notes
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-notes', 'read'),
  ('student-notes', 'create'),
  ('student-notes', 'update'),
  ('student-notes', 'delete')
) AS v(resource, action)
ON CONFLICT (preset_id, resource, action) DO NOTHING;
