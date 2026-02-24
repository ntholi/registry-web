ALTER TABLE "audit_logs" ADD COLUMN "std_no" bigint;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "changed_by_role" text;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_std_no" ON "audit_logs" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_changed_by_role" ON "audit_logs" USING btree ("changed_by_role");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_std_no_role" ON "audit_logs" USING btree ("std_no","changed_by_role");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_std_no_date" ON "audit_logs" USING btree ("std_no","changed_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_std_no_role_date" ON "audit_logs" USING btree ("std_no","changed_by_role","changed_at");