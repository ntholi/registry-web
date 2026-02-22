CREATE TABLE "applicant_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"country" text,
	"city" text,
	"district" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "applicant_locations_applicantId_unique" UNIQUE("applicant_id")
);
--> statement-breakpoint
ALTER TABLE "applicant_locations" ADD CONSTRAINT "applicant_locations_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_applicant_locations_applicant" ON "applicant_locations" USING btree ("applicant_id");