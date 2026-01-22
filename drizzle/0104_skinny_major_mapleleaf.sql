CREATE TYPE "public"."reservation_status" AS ENUM('Active', 'Fulfilled', 'Cancelled', 'Expired');--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"std_no" bigint NOT NULL,
	"reservation_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"status" "reservation_status" DEFAULT 'Active' NOT NULL,
	"reserved_by" text,
	"fulfilled_by" text,
	"fulfilled_at" timestamp,
	"cancelled_by" text,
	"cancelled_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_fulfilled_by_users_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reservations_book_id" ON "reservations" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_std_no" ON "reservations" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_reservations_status" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservations_expiry_date" ON "reservations" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_reservations_std_no_status" ON "reservations" USING btree ("std_no","status");