-- Custom SQL migration file, put your code below! --
CREATE TABLE "feedback_cycle_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "feedback_cycle_schools_cycle_id_school_id_unique" UNIQUE("cycle_id","school_id")
);

CREATE INDEX "idx_feedback_cycle_schools_cycle_id" ON "feedback_cycle_schools" USING btree ("cycle_id");
CREATE INDEX "idx_feedback_cycle_schools_school_id" ON "feedback_cycle_schools" USING btree ("school_id");

ALTER TABLE "feedback_cycle_schools" ADD CONSTRAINT "feedback_cycle_schools_cycle_id_feedback_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."feedback_cycles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "feedback_cycle_schools" ADD CONSTRAINT "feedback_cycle_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;