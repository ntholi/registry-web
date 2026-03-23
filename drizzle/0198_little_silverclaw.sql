-- Grant users:read to Academic Manager and Program Leader presets
-- These presets access the lecturers service which internally calls
-- getUserSchoolIds requiring users:read permission
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, p.id, 'users', 'read'
FROM permission_presets p
WHERE p.name IN ('Academic Manager', 'Program Leader')
ON CONFLICT DO NOTHING;