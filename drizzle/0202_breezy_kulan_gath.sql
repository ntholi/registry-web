CREATE TABLE "letters" (
	"id" text PRIMARY KEY NOT NULL,
	"serial_number" text NOT NULL,
	"template_id" text,
	"std_no" bigint NOT NULL,
	"content" text NOT NULL,
	"status_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "letters_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_status_id_student_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."student_statuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;