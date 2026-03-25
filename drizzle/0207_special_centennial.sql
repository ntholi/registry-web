-- Seed allowed program statuses for completion/conduct templates --
UPDATE letter_templates SET allowed_program_statuses = '{Completed}'
WHERE id IN ('tpl_completion_qual', 'tpl_good_conduct');