DELETE FROM "timetable_slot_allocations";--> statement-breakpoint
DELETE FROM "timetable_slots";--> statement-breakpoint
DELETE FROM "timetable_allocation_venue_types";--> statement-breakpoint
DELETE FROM "venue_schools";--> statement-breakpoint
DELETE FROM "venues";--> statement-breakpoint
DELETE FROM "venue_types";--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" DROP CONSTRAINT "timetable_allocation_venue_types_venue_type_id_venue_types_id_fk";--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP CONSTRAINT "timetable_slots_venue_id_venues_id_fk";--> statement-breakpoint
ALTER TABLE "venue_schools" DROP CONSTRAINT "venue_schools_venue_id_venues_id_fk";--> statement-breakpoint
ALTER TABLE "venues" DROP CONSTRAINT "venues_type_id_venue_types_id_fk";--> statement-breakpoint
ALTER TABLE "venue_types" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venue_types" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "type_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" ALTER COLUMN "venue_type_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "timetable_slots" ALTER COLUMN "venue_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venue_schools" ALTER COLUMN "venue_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" ADD CONSTRAINT "timetable_allocation_venue_types_venue_type_id_venue_types_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."venue_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_schools" ADD CONSTRAINT "venue_schools_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_type_id_venue_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."venue_types"("id") ON DELETE restrict ON UPDATE no action;