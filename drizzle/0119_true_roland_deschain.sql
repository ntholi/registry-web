ALTER TABLE "auto_approval_rules" RENAME TO "auto_approvals";--> statement-breakpoint
ALTER TABLE "auto_approvals" DROP CONSTRAINT "auto_approval_rules_term_id_terms_id_fk";
--> statement-breakpoint
ALTER TABLE "auto_approvals" DROP CONSTRAINT "auto_approval_rules_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auto_approvals" ADD CONSTRAINT "auto_approvals_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_approvals" ADD CONSTRAINT "auto_approvals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;