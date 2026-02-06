-- Migration: Allow overflow for allocation 27 in Room 4
-- Problem: Allocation 27 (58 students) exceeds Room 4 capacity (50) and 10% tolerance (55)
-- Solution: Specifically allow overflow for this allocation in Room 4

DELETE FROM timetable_allocation_allowed_venues WHERE timetable_allocation_id = 27;

INSERT INTO timetable_allocation_allowed_venues (timetable_allocation_id, venue_id, allow_overflow)
VALUES (27, 'IEoB5xq03Nen3AvAIsxR4', true);
