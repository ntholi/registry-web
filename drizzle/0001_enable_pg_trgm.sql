-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create an index on student names for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_students_name_trgm ON students USING gin (name gin_trgm_ops);
