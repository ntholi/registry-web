CREATE TABLE "student_status_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"status_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_key" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_status_attachments" ADD CONSTRAINT "student_status_attachments_status_id_student_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."student_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_student_status_attachments_status" ON "student_status_attachments" USING btree ("status_id");