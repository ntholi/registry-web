ALTER TABLE "applicants" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_applicants_user" ON "applicants" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_userId_unique" UNIQUE("user_id");