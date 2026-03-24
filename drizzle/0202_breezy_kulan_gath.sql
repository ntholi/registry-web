-- Sequence for letter serial numbers
CREATE SEQUENCE IF NOT EXISTS letter_serial_seq START 1;
--> statement-breakpoint

-- Function: generate_letter_serial()
-- Format: LTR + LL + NNNNN where LL = AA..ZZ (676 groups), NNNNN = 00001..99999 per group
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
--> statement-breakpoint

CREATE TABLE "letter_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"org" text NOT NULL,
	"address" text,
	"city" text,
	"popularity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" text PRIMARY KEY NOT NULL,
	"serial_number" text DEFAULT generate_letter_serial() NOT NULL,
	"template_id" text,
	"std_no" bigint NOT NULL,
	"content" text NOT NULL,
	"subject" text,
	"salutation" text DEFAULT 'Dear Sir/Madam,' NOT NULL,
	"recipient_id" text,
	"status_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "letters_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "letter_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"salutation" text DEFAULT 'Dear Sir/Madam,' NOT NULL,
	"content" text NOT NULL,
	"sign_off_name" text,
	"sign_off_title" text,
	"role" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "letter_recipients" ADD CONSTRAINT "letter_recipients_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_recipient_id_letter_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."letter_recipients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_status_id_student_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."student_statuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_templates" ADD CONSTRAINT "letter_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Grant letter-templates full CRUD to Registry Manager
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letter-templates', a.action
FROM permission_presets pp
CROSS JOIN (VALUES ('read'), ('create'), ('update'), ('delete')) AS a(action)
WHERE pp.name = 'Registry Manager' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letter-templates' AND p.action = a.action
  );
--> statement-breakpoint

-- Grant letter-templates read to Registry Staff
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letter-templates', 'read'
FROM permission_presets pp
WHERE pp.name = 'Registry Staff' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letter-templates' AND p.action = 'read'
  );
--> statement-breakpoint

-- Grant letter-templates read to Academic Manager and Academic Admin
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letter-templates', 'read'
FROM permission_presets pp
WHERE pp.name IN ('Academic Manager', 'Academic Admin') AND pp.role = 'academic'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letter-templates' AND p.action = 'read'
  );
--> statement-breakpoint

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
--> statement-breakpoint

-- Grant letters read+create to Registry Staff
INSERT INTO preset_permissions (id, preset_id, resource, action)
SELECT gen_random_uuid()::text, pp.id, 'letters', a.action
FROM permission_presets pp
CROSS JOIN (VALUES ('read'), ('create')) AS a(action)
WHERE pp.name = 'Registry Staff' AND pp.role = 'registry'
  AND NOT EXISTS (
    SELECT 1 FROM preset_permissions p
    WHERE p.preset_id = pp.id AND p.resource = 'letters' AND p.action = a.action
  );