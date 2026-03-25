-- Custom SQL migration file, put your code below! --

-- Academic Admin: remove assessments and attendance permissions, add letters full CRUD
DELETE FROM preset_permissions
WHERE preset_id = (SELECT id FROM permission_presets WHERE name = 'Academic Admin')
  AND resource IN ('assessments', 'attendance');

INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, v.resource, v.action
FROM permission_presets p
CROSS JOIN (VALUES
  ('letters', 'read'),
  ('letters', 'create'),
  ('letters', 'update'),
  ('letters', 'delete')
) AS v(resource, action)
WHERE p.name = 'Academic Admin'
ON CONFLICT (preset_id, resource, action) DO NOTHING;
