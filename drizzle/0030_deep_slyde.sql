ALTER TABLE "lecturer_allocation_venue_types" RENAME TO "timetable_allocation_venue_types";--> statement-breakpoint
ALTER TABLE "lecturer_allocations" RENAME TO "timetable_allocations";--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" RENAME COLUMN "lecturer_allocation_id" TO "timetable_allocation_id";--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" DROP CONSTRAINT "lecturer_allocation_venue_types_lecturer_allocation_id_lecturer_allocations_id_fk";
--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" DROP CONSTRAINT "lecturer_allocation_venue_types_venue_type_id_venue_types_id_fk";
--> statement-breakpoint
ALTER TABLE "timetable_allocations" DROP CONSTRAINT "lecturer_allocations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "timetable_allocations" DROP CONSTRAINT "lecturer_allocations_semester_module_id_semester_modules_id_fk";
--> statement-breakpoint
ALTER TABLE "timetable_allocations" DROP CONSTRAINT "lecturer_allocations_term_id_terms_id_fk";
--> statement-breakpoint
DROP INDEX "fk_lecturer_allocation_venue_types_allocation_id";--> statement-breakpoint
DROP INDEX "fk_lecturer_allocation_venue_types_venue_type_id";--> statement-breakpoint
DROP INDEX "fk_lecturer_allocations_user_id";--> statement-breakpoint
DROP INDEX "fk_lecturer_allocations_semester_module_id";--> statement-breakpoint
DROP INDEX "fk_lecturer_allocations_term_id";--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" DROP CONSTRAINT "lecturer_allocation_venue_types_lecturer_allocation_id_venue_type_id_pk";--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" ADD CONSTRAINT "timetable_allocation_venue_types_timetable_allocation_id_venue_type_id_pk" PRIMARY KEY("timetable_allocation_id","venue_type_id");--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" ADD CONSTRAINT "timetable_allocation_venue_types_timetable_allocation_id_timetable_allocations_id_fk" FOREIGN KEY ("timetable_allocation_id") REFERENCES "public"."timetable_allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_allocation_venue_types" ADD CONSTRAINT "timetable_allocation_venue_types_venue_type_id_venue_types_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."venue_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_allocations" ADD CONSTRAINT "timetable_allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_allocations" ADD CONSTRAINT "timetable_allocations_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_allocations" ADD CONSTRAINT "timetable_allocations_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_timetable_allocation_venue_types_allocation_id" ON "timetable_allocation_venue_types" USING btree ("timetable_allocation_id");--> statement-breakpoint
CREATE INDEX "fk_timetable_allocation_venue_types_venue_type_id" ON "timetable_allocation_venue_types" USING btree ("venue_type_id");--> statement-breakpoint
CREATE INDEX "fk_timetable_allocations_user_id" ON "timetable_allocations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fk_timetable_allocations_semester_module_id" ON "timetable_allocations" USING btree ("semester_module_id");--> statement-breakpoint
CREATE INDEX "fk_timetable_allocations_term_id" ON "timetable_allocations" USING btree ("term_id");