ALTER TABLE "audit_logs" ADD COLUMN "activity_type" text;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_activity_type" ON "audit_logs" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_activity" ON "audit_logs" USING btree ("changed_by","activity_type","changed_at");