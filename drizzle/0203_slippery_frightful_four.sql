-- Sequence for letter serial numbers
CREATE SEQUENCE IF NOT EXISTS letter_serial_seq START 1;

-- Function: generate_letter_serial()
-- Format: LTR + LL + NNNNN where LL = AA..ZZ (676 groups), NNNNN = 00001..99999 per group
-- LTRAA00001..LTRAA99999 → LTRAB00001..LTRAB99999 → ... → LTRZZ99999
CREATE OR REPLACE FUNCTION generate_letter_serial() RETURNS text AS $$
DECLARE
  val bigint;
  pair_idx int;
  num int;
  letter1 char;
  letter2 char;
BEGIN
  val := nextval('letter_serial_seq');
  pair_idx := ((val - 1) / 99999)::int;
  num := ((val - 1) % 99999 + 1)::int;
  letter1 := chr(65 + (pair_idx / 26)::int);
  letter2 := chr(65 + (pair_idx % 26)::int);
  RETURN 'LTR' || letter1 || letter2 || lpad(num::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

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