CREATE TABLE "room_schools" (
	"room_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "room_schools_room_id_school_id_pk" PRIMARY KEY("room_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "room_schools" ADD CONSTRAINT "room_schools_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_schools" ADD CONSTRAINT "room_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_type_id_room_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_room_schools_room_id" ON "room_schools" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "fk_room_schools_school_id" ON "room_schools" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "fk_rooms_type_id" ON "rooms" USING btree ("type_id");