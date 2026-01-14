CREATE TYPE "public"."certificate_reprint_status" AS ENUM('pending', 'printed');--> statement-breakpoint
CREATE TABLE "certificate_reprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"receipt_number" text,
	"reason" text NOT NULL,
	"status" "certificate_reprint_status" DEFAULT 'pending' NOT NULL,
	"received_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "certificate_reprints" ADD CONSTRAINT "certificate_reprints_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_reprints" ADD CONSTRAINT "certificate_reprints_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_certificate_reprints_std_no" ON "certificate_reprints" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "fk_certificate_reprints_created_by" ON "certificate_reprints" USING btree ("created_by");