CREATE TABLE "student_semester_sync_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_semester_id" integer NOT NULL,
	"old_values" jsonb NOT NULL,
	"new_values" jsonb NOT NULL,
	"reasons" text,
	"updated_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_semester_sync_records" ADD CONSTRAINT "student_semester_sync_records_student_semester_id_student_semesters_id_fk" FOREIGN KEY ("student_semester_id") REFERENCES "public"."student_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_semester_sync_records" ADD CONSTRAINT "student_semester_sync_records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_student_semester_sync_records_student_semester_id" ON "student_semester_sync_records" USING btree ("student_semester_id");--> statement-breakpoint
CREATE INDEX "fk_student_semester_sync_records_updated_by" ON "student_semester_sync_records" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "idx_student_semester_sync_records_synced_at" ON "student_semester_sync_records" USING btree ("synced_at");