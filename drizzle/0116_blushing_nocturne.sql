CREATE TABLE "auto_approval_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" integer NOT NULL,
	"term_id" integer NOT NULL,
	"department" "dashboard_users" NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_auto_approval_rule" UNIQUE("std_no","term_id","department")
);
--> statement-breakpoint
ALTER TABLE "auto_approval_rules" ADD CONSTRAINT "auto_approval_rules_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_approval_rules" ADD CONSTRAINT "auto_approval_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_auto_approval_std_no" ON "auto_approval_rules" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_auto_approval_term_id" ON "auto_approval_rules" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "idx_auto_approval_department" ON "auto_approval_rules" USING btree ("department");