ALTER TABLE "letter_templates" ADD COLUMN "restrictions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint

UPDATE "letter_templates" SET "restrictions" = '[{"type":"semesterStatus","operator":"include","values":["Active","Enrolled","Exempted","Outstanding","Repeat","DNR"]}]'::jsonb
WHERE "id" IN ('tpl_confirmation_student', 'tpl_industry_request');--> statement-breakpoint

UPDATE "letter_templates" SET "restrictions" = '[{"type":"studentStatus","operator":"include","values":["Active"]},{"type":"semesterStatus","operator":"include","values":["Active","Enrolled","Exempted","Outstanding","Repeat","DNR"]}]'::jsonb
WHERE "id" IN ('tpl_identity_card', 'tpl_passport', 'tpl_visa');--> statement-breakpoint

UPDATE "letter_templates" SET "restrictions" = '[{"type":"studentStatus","operator":"include","values":["Active"]},{"type":"programStatus","operator":"include","values":["Active"]},{"type":"semesterStatus","operator":"include","values":["Active","Enrolled","Exempted","Outstanding","Repeat","DNR"]}]'::jsonb
WHERE "id" = 'tpl_change_programme';--> statement-breakpoint

UPDATE "letter_templates" SET "restrictions" = '[{"type":"programStatus","operator":"include","values":["Completed"]}]'::jsonb
WHERE "id" IN ('tpl_completion_qual', 'tpl_good_conduct', 'tpl_reference');--> statement-breakpoint

UPDATE "letter_templates" SET "restrictions" = '[{"type":"studentStatus","operator":"include","values":["Active"]},{"type":"semesterStatus","operator":"include","values":["Deferred"]}]'::jsonb
WHERE "id" = 'tpl_deferment';--> statement-breakpoint

UPDATE "letter_templates" SET "restrictions" = '[{"type":"studentStatus","operator":"include","values":["Active"]},{"type":"semesterStatus","operator":"include","values":["Withdrawn"]}]'::jsonb
WHERE "id" = 'tpl_withdrawal';