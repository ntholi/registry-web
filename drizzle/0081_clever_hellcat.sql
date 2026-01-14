DELETE FROM "timetable_slot_allocations";--> statement-breakpoint
DELETE FROM "timetable_slots";--> statement-breakpoint
DELETE FROM "timetable_allocation_venue_types";--> statement-breakpoint
DELETE FROM "venue_schools";--> statement-breakpoint
DELETE FROM "venues";--> statement-breakpoint
DELETE FROM "venue_types";--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" ALTER COLUMN "venue_type_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "timetable_slots" ALTER COLUMN "venue_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venue_schools" ALTER COLUMN "venue_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venue_types" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venue_types" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "type_id" SET DATA TYPE text;