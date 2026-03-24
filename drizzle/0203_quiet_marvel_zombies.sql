-- Grant letters full CRUD to Registry Manager
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letters', a.action
FROM permission_presets pp
CROSS JOIN (VALUES ('read'), ('create'), ('update'), ('delete')) AS a(action)
WHERE pp.name = 'Registry Manager' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letters' AND p.action = a.action
  );

-- Grant letters read+create to Registry Staff
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letters', a.action
FROM permission_presets pp
CROSS JOIN (VALUES ('read'), ('create')) AS a(action)
WHERE pp.name = 'Registry Staff' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letters' AND p.action = a.action
  ); file, put your code below! --