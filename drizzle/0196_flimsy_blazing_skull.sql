-- Custom SQL migration: Consolidate Mathematical Literacy as a separate subject
-- using the existing "MATHEMATICAL LITERACY" record and seeding SA language subjects.

-- Step 1: Rename "MATHEMATICAL LITERACY" to "Mathematical Literacy", activate it, set LQF level 4
UPDATE subjects SET name = 'Mathematical Literacy', is_active = true, lqf_level = 4, updated_at = NOW()
WHERE id = 'PvHp4pTkQxEZxgXeiYUFZ';

-- Step 2: Move grades from "Maths Literacy" to "Mathematical Literacy" (skip conflicts)
UPDATE subject_grades SET subject_id = 'PvHp4pTkQxEZxgXeiYUFZ'
WHERE subject_id = 'IxJS8JWrkjmSa7J8FATq0'
AND academic_record_id NOT IN (
    SELECT academic_record_id FROM subject_grades WHERE subject_id = 'PvHp4pTkQxEZxgXeiYUFZ'
);

-- Step 3: Delete any remaining orphan grades from "Maths Literacy" (conflicts)
DELETE FROM subject_grades WHERE subject_id = 'IxJS8JWrkjmSa7J8FATq0';

-- Step 4: Delete aliases pointing to "Maths Literacy"
DELETE FROM subject_aliases WHERE subject_id = 'IxJS8JWrkjmSa7J8FATq0';

-- Step 5: Deactivate "Maths Literacy"
UPDATE subjects SET is_active = false, updated_at = NOW()
WHERE id = 'IxJS8JWrkjmSa7J8FATq0';

-- Step 6: Add aliases to "Mathematical Literacy" (PvHp4pTkQxEZxgXeiYUFZ)
INSERT INTO subject_aliases (id, subject_id, alias, created_at)
VALUES
    (gen_random_uuid()::text, 'PvHp4pTkQxEZxgXeiYUFZ', 'Maths Literacy', NOW()),
    (gen_random_uuid()::text, 'PvHp4pTkQxEZxgXeiYUFZ', 'Maths Lit', NOW()),
    (gen_random_uuid()::text, 'PvHp4pTkQxEZxgXeiYUFZ', 'Math Literacy', NOW()),
    (gen_random_uuid()::text, 'PvHp4pTkQxEZxgXeiYUFZ', 'Mathematical Lit', NOW()),
    (gen_random_uuid()::text, 'PvHp4pTkQxEZxgXeiYUFZ', 'MATHEMATICAL LITERACY', NOW()),
    (gen_random_uuid()::text, 'PvHp4pTkQxEZxgXeiYUFZ', 'Mathemetical Literacy', NOW())
ON CONFLICT (alias) DO NOTHING;

-- Step 7: Remove any math literacy aliases from Mathematics (safety)
DELETE FROM subject_aliases
WHERE subject_id = '_0bd1XcgOZoA3cwBUOe50'
AND alias IN ('Mathematical Literacy', 'Maths Literacy', 'Maths Lit', 'Math Literacy');

-- Step 8: Seed missing South African language subjects for NSC support
INSERT INTO subjects (id, name, lqf_level, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid()::text, 'Tshivenda', 4, true, NOW(), NOW()),
    (gen_random_uuid()::text, 'Xitsonga', 4, true, NOW(), NOW()),
    (gen_random_uuid()::text, 'IsiNdebele', 4, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 9: Add aliases for Tshivenda
INSERT INTO subject_aliases (id, subject_id, alias, created_at)
SELECT gen_random_uuid()::text, s.id, a.alias, NOW()
FROM subjects s
CROSS JOIN (VALUES
    ('Tshivenda First Language'),
    ('Tshivenda Second Language'),
    ('Tshivenda Home Language'),
    ('Tshivenda First Additional Language'),
    ('Tshivenda HL'),
    ('Tshivenda FAL'),
    ('Venda')
) AS a(alias)
WHERE s.name = 'Tshivenda'
ON CONFLICT (alias) DO NOTHING;

-- Step 10: Add aliases for Xitsonga
INSERT INTO subject_aliases (id, subject_id, alias, created_at)
SELECT gen_random_uuid()::text, s.id, a.alias, NOW()
FROM subjects s
CROSS JOIN (VALUES
    ('Xitsonga First Language'),
    ('Xitsonga Second Language'),
    ('Xitsonga Home Language'),
    ('Xitsonga First Additional Language'),
    ('Xitsonga HL'),
    ('Xitsonga FAL'),
    ('Tsonga')
) AS a(alias)
WHERE s.name = 'Xitsonga'
ON CONFLICT (alias) DO NOTHING;

-- Step 11: Add aliases for IsiNdebele
INSERT INTO subject_aliases (id, subject_id, alias, created_at)
SELECT gen_random_uuid()::text, s.id, a.alias, NOW()
FROM subjects s
CROSS JOIN (VALUES
    ('IsiNdebele First Language'),
    ('IsiNdebele Second Language'),
    ('IsiNdebele Home Language'),
    ('IsiNdebele First Additional Language'),
    ('IsiNdebele HL'),
    ('IsiNdebele FAL'),
    ('Ndebele')
) AS a(alias)
WHERE s.name = 'IsiNdebele'
ON CONFLICT (alias) DO NOTHING;