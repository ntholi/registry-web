ALTER TABLE "room_types" ADD CONSTRAINT "room_types_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_name_unique" UNIQUE("name");