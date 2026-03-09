CREATE TYPE "public"."note_visibility" AS ENUM('role', 'self', 'everyone');--> statement-breakpoint
CREATE TABLE "student_note_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_key" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"content" text NOT NULL,
	"visibility" "note_visibility" DEFAULT 'role' NOT NULL,
	"creator_role" "user_roles" NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_note_attachments" ADD CONSTRAINT "student_note_attachments_note_id_student_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."student_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_student_note_attachments_note" ON "student_note_attachments" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_student_notes_std_no" ON "student_notes" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_student_notes_created_by" ON "student_notes" USING btree ("created_by");