-- Ensure the term 2026-02 exists
INSERT INTO terms (code, is_active, semester, year, start_date, end_date)
VALUES ('2026-02', false, 2, 2026, '2026-02-02', '2026-06-30')
ON CONFLICT (code) DO NOTHING;

-- Move all timetable related data to 2026-02
UPDATE timetable_allocations 
SET term_id = (SELECT id FROM terms WHERE code = '2026-02')
WHERE term_id != (SELECT id FROM terms WHERE code = '2026-02');

UPDATE timetable_slots 
SET term_id = (SELECT id FROM terms WHERE code = '2026-02')
WHERE term_id != (SELECT id FROM terms WHERE code = '2026-02');
