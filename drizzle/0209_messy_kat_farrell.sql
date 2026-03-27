-- Add 'read' and 'reject' to student-statuses for presets that have 'approve'
-- Affected: Academic Manager, Program Leader, Year Leader, Finance Staff, Finance Manager

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-statuses', 'reject')
) AS v(resource, action)
WHERE p.name = 'Academic Manager'
ON CONFLICT (preset_id, resource, action) DO NOTHING;
--> statement-breakpoint

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-statuses', 'read'),
  ('student-statuses', 'reject')
) AS v(resource, action)
WHERE p.name = 'Program Leader'
ON CONFLICT (preset_id, resource, action) DO NOTHING;
--> statement-breakpoint

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-statuses', 'read'),
  ('student-statuses', 'reject')
) AS v(resource, action)
WHERE p.name = 'Year Leader'
ON CONFLICT (preset_id, resource, action) DO NOTHING;
--> statement-breakpoint

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-statuses', 'reject')
) AS v(resource, action)
WHERE p.name = 'Finance Staff'
ON CONFLICT (preset_id, resource, action) DO NOTHING;
--> statement-breakpoint

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('student-statuses', 'reject')
) AS v(resource, action)
WHERE p.name = 'Finance Manager'
ON CONFLICT (preset_id, resource, action) DO NOTHING;