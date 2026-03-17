CREATE TYPE "public"."observation_section" AS ENUM('teaching_observation', 'assessments', 'other');--> statement-breakpoint
CREATE TABLE "observation_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"section" "observation_section" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "observation_criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"text" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "observation_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"observation_id" text NOT NULL,
	"criterion_id" text NOT NULL,
	"rating" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "observation_ratings_observationId_criterionId_unique" UNIQUE("observation_id","criterion_id")
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"assigned_module_id" integer NOT NULL,
	"observer_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"strengths" text,
	"improvements" text,
	"recommendations" text,
	"training_area" text,
	"submitted_at" timestamp,
	"acknowledged_at" timestamp,
	"acknowledgment_comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "observations_cycleId_assignedModuleId_unique" UNIQUE("cycle_id","assigned_module_id")
);
--> statement-breakpoint
ALTER TABLE "observation_criteria" ADD CONSTRAINT "observation_criteria_category_id_observation_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."observation_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_ratings" ADD CONSTRAINT "observation_ratings_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_ratings" ADD CONSTRAINT "observation_ratings_criterion_id_observation_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."observation_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_cycle_id_feedback_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."feedback_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_assigned_module_id_assigned_modules_id_fk" FOREIGN KEY ("assigned_module_id") REFERENCES "public"."assigned_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_observer_id_users_id_fk" FOREIGN KEY ("observer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_observation_criteria_category_id" ON "observation_criteria" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_observation_ratings_observation_id" ON "observation_ratings" USING btree ("observation_id");--> statement-breakpoint
CREATE INDEX "idx_observations_cycle_id" ON "observations" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_observations_observer_id" ON "observations" USING btree ("observer_id");--> statement-breakpoint
CREATE INDEX "idx_observations_assigned_module_id" ON "observations" USING btree ("assigned_module_id");--> statement-breakpoint
CREATE INDEX "idx_observations_status" ON "observations" USING btree ("status");