-- Grant letter-templates full CRUD to Registry Manager
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letter-templates', a.action
FROM permission_presets pp
CROSS JOIN (VALUES ('read'), ('create'), ('update'), ('delete')) AS a(action)
WHERE pp.name = 'Registry Manager' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letter-templates' AND p.action = a.action
  );

-- Grant letter-templates read to Registry Staff
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letter-templates', 'read'
FROM permission_presets pp
WHERE pp.name = 'Registry Staff' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letter-templates' AND p.action = 'read'
  );

-- Grant letter-templates read to Academic Manager and Academic Admin
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letter-templates', 'read'
FROM permission_presets pp
WHERE pp.name IN ('Academic Manager', 'Academic Admin') AND pp.role = 'academic'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letter-templates' AND p.action = 'read'
  );