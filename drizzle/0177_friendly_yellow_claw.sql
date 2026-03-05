ALTER TABLE "task_assignees" DROP CONSTRAINT "task_assignees_task_id_tasks_id_fk";--> statement-breakpoint
ALTER TABLE "task_students" DROP CONSTRAINT "task_students_task_id_tasks_id_fk";--> statement-breakpoint
ALTER TABLE "task_assignees" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task_assignees" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "task_assignees" ALTER COLUMN "task_id" SET DATA TYPE text USING task_id::text;--> statement-breakpoint
ALTER TABLE "task_students" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task_students" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "task_students" ALTER COLUMN "task_id" SET DATA TYPE text USING task_id::text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "id" SET DATA TYPE text USING id::text;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_students" ADD CONSTRAINT "task_students_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;