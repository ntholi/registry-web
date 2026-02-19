-- Custom SQL migration file, put your code below! --

-- Insert Edexcel IGCSE certificate type
INSERT INTO "certificate_types" ("id", "name", "description", "lqf_level", "grading_type", "created_at", "updated_at")
VALUES (
  'edexcel_igcse',
  'Edexcel IGCSE',
  'Pearson Edexcel International General Certificate of Secondary Education',
  4,
  'subject-grades',
  NOW(),
  NOW()
)
ON CONFLICT ("name") DO NOTHING;

-- Insert grade mappings for Edexcel IGCSE (numeric 9-1 to LGCSE letter equivalents)
INSERT INTO "grade_mappings" ("id", "certificate_type_id", "original_grade", "standard_grade")
VALUES
  ('edx_igcse_9', 'edexcel_igcse', '9', 'A*'),
  ('edx_igcse_8', 'edexcel_igcse', '8', 'A*'),
  ('edx_igcse_7', 'edexcel_igcse', '7', 'A'),
  ('edx_igcse_6', 'edexcel_igcse', '6', 'B'),
  ('edx_igcse_5', 'edexcel_igcse', '5', 'B'),
  ('edx_igcse_4', 'edexcel_igcse', '4', 'C'),
  ('edx_igcse_3', 'edexcel_igcse', '3', 'D'),
  ('edx_igcse_2', 'edexcel_igcse', '2', 'E'),
  ('edx_igcse_1', 'edexcel_igcse', '1', 'F'),
  ('edx_igcse_u', 'edexcel_igcse', 'U', 'U')
ON CONFLICT ON CONSTRAINT "uq_grade_mappings_cert_grade" DO NOTHING;