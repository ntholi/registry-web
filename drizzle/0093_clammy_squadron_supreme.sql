CREATE TABLE "timetable_allocation_allowed_venues" (
	"timetable_allocation_id" integer NOT NULL,
	"venue_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "timetable_allocation_allowed_venues_timetable_allocation_id_venue_id_pk" PRIMARY KEY("timetable_allocation_id","venue_id")
);
--> statement-breakpoint
ALTER TABLE "timetable_allocation_allowed_venues" ADD CONSTRAINT "timetable_allocation_allowed_venues_timetable_allocation_id_timetable_allocations_id_fk" FOREIGN KEY ("timetable_allocation_id") REFERENCES "public"."timetable_allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_allocation_allowed_venues" ADD CONSTRAINT "timetable_allocation_allowed_venues_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_timetable_allocation_allowed_venues_allocation_id" ON "timetable_allocation_allowed_venues" USING btree ("timetable_allocation_id");--> statement-breakpoint
CREATE INDEX "fk_timetable_allocation_allowed_venues_venue_id" ON "timetable_allocation_allowed_venues" USING btree ("venue_id");