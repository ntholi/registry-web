CREATE TABLE "venue_schools" (
	"venue_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "venue_schools_venue_id_school_id_pk" PRIMARY KEY("venue_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "venues_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DROP TABLE "room_schools" CASCADE;--> statement-breakpoint
DROP TABLE "room_types" CASCADE;--> statement-breakpoint
DROP TABLE "rooms" CASCADE;--> statement-breakpoint
ALTER TABLE "venue_schools" ADD CONSTRAINT "venue_schools_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_schools" ADD CONSTRAINT "venue_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_type_id_venue_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."venue_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_venue_schools_venue_id" ON "venue_schools" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "fk_venue_schools_school_id" ON "venue_schools" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "fk_venues_type_id" ON "venues" USING btree ("type_id");