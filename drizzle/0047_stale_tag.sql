CREATE TABLE "task_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "task_students" ADD CONSTRAINT "task_students_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_students" ADD CONSTRAINT "task_students_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_task_students_task_id" ON "task_students" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_students_std_no" ON "task_students" USING btree ("std_no");