CREATE TABLE "lecturer_allocation_venue_types" (
	"lecturer_allocation_id" integer NOT NULL,
	"venue_type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "lecturer_allocation_venue_types_lecturer_allocation_id_venue_type_id_pk" PRIMARY KEY("lecturer_allocation_id","venue_type_id")
);
--> statement-breakpoint
CREATE TABLE "venue_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "venue_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "lecturer_allocation_venue_types" ADD CONSTRAINT "lecturer_allocation_venue_types_lecturer_allocation_id_lecturer_allocations_id_fk" FOREIGN KEY ("lecturer_allocation_id") REFERENCES "public"."lecturer_allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturer_allocation_venue_types" ADD CONSTRAINT "lecturer_allocation_venue_types_venue_type_id_venue_types_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."venue_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_lecturer_allocation_venue_types_allocation_id" ON "lecturer_allocation_venue_types" USING btree ("lecturer_allocation_id");--> statement-breakpoint
CREATE INDEX "fk_lecturer_allocation_venue_types_venue_type_id" ON "lecturer_allocation_venue_types" USING btree ("venue_type_id");