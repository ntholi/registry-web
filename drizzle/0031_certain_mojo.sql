CREATE TABLE "timetable_slot_allocations" (
	"slot_id" integer NOT NULL,
	"timetable_allocation_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "timetable_slot_allocations_slot_id_timetable_allocation_id_pk" PRIMARY KEY("slot_id","timetable_allocation_id")
);
--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"term_id" integer NOT NULL,
	"venue_id" integer NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"capacity_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_timetable_slots_schedule" UNIQUE("venue_id","day_of_week","start_time","end_time")
);
--> statement-breakpoint
ALTER TABLE "timetable_slot_allocations" ADD CONSTRAINT "timetable_slot_allocations_slot_id_timetable_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."timetable_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slot_allocations" ADD CONSTRAINT "timetable_slot_allocations_timetable_allocation_id_timetable_allocations_id_fk" FOREIGN KEY ("timetable_allocation_id") REFERENCES "public"."timetable_allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_timetable_slot_allocations_allocation" ON "timetable_slot_allocations" USING btree ("timetable_allocation_id");--> statement-breakpoint
CREATE INDEX "idx_timetable_slots_term_id" ON "timetable_slots" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "idx_timetable_slots_venue_day" ON "timetable_slots" USING btree ("venue_id","day_of_week");