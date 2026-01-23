CREATE TABLE "intake_period_programs" (
	"intake_period_id" text NOT NULL,
	"program_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "intake_period_programs_intake_period_id_program_id_pk" PRIMARY KEY("intake_period_id","program_id")
);
--> statement-breakpoint
ALTER TABLE "intake_period_programs" ADD CONSTRAINT "intake_period_programs_intake_period_id_intake_periods_id_fk" FOREIGN KEY ("intake_period_id") REFERENCES "public"."intake_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake_period_programs" ADD CONSTRAINT "intake_period_programs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_intake_period_programs_intake" ON "intake_period_programs" USING btree ("intake_period_id");--> statement-breakpoint
CREATE INDEX "fk_intake_period_programs_program" ON "intake_period_programs" USING btree ("program_id");