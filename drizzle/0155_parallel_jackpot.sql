CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"operation" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_table_record" ON "audit_logs" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_changed_by" ON "audit_logs" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_changed_at" ON "audit_logs" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_table_operation" ON "audit_logs" USING btree ("table_name","operation");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_synced_at" ON "audit_logs" USING btree ("synced_at");