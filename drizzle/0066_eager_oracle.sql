-- Custom SQL migration file, put your code below! --
UPDATE graduation_requests
SET graduation_date_id = (SELECT id FROM graduation_dates WHERE date = '2025-10-02' LIMIT 1)
WHERE EXTRACT(YEAR FROM created_at) IN (2025, 2026)
AND graduation_date_id IS NULL;