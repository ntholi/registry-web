-- Add students:read permission to Lecturer, Principal Lecturer, and Academic Admin presets
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'students', 'read'
FROM permission_presets pp
WHERE pp.name IN ('Lecturer', 'Principal Lecturer', 'Academic Admin')
  AND pp.role = 'academic'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'students' AND p.action = 'read'
  );