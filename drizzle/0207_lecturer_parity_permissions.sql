-- Custom SQL migration file, put your code below! --

-- Year Leader: add missing Lecturer permissions (assessments CRUD, gradebook, student-feedback-reports, assigned-modules, reports-course-summary, attendance create/update)
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('assessments', 'read'),
  ('assessments', 'create'),
  ('assessments', 'update'),
  ('assessments', 'delete'),
  ('gradebook', 'read'),
  ('gradebook', 'update'),
  ('student-feedback-reports', 'read'),
  ('assigned-modules', 'read'),
  ('reports-course-summary', 'read'),
  ('attendance', 'create'),
  ('attendance', 'update')
) AS v(resource, action)
WHERE p.name = 'Year Leader'
ON CONFLICT (preset_id, resource, action) DO NOTHING;

-- Program Leader: add missing Lecturer permissions (assessments CRUD, student-feedback-reports, attendance create/update)
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('assessments', 'read'),
  ('assessments', 'create'),
  ('assessments', 'update'),
  ('assessments', 'delete'),
  ('student-feedback-reports', 'read'),
  ('attendance', 'create'),
  ('attendance', 'update')
) AS v(resource, action)
WHERE p.name = 'Program Leader'
ON CONFLICT (preset_id, resource, action) DO NOTHING;