CREATE TYPE "public"."mail_queue_status" AS ENUM('pending', 'processing', 'sent', 'failed', 'retry');--> statement-breakpoint
CREATE TYPE "public"."mail_trigger_type" AS ENUM('student_status_created', 'student_status_updated', 'student_status_approved', 'student_status_rejected', 'notification_mirror', 'manual', 'reply');--> statement-breakpoint
CREATE TABLE "mail_account_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mail_account_id" text NOT NULL,
	"role" text,
	"user_id" text,
	"can_compose" boolean DEFAULT false NOT NULL,
	"can_reply" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail_assignments_role_or_user" CHECK ((role IS NOT NULL AND user_id IS NULL) OR (role IS NULL AND user_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "mail_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scope" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"signature" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mail_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "mail_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"mail_account_id" text NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"attachments" jsonb,
	"status" "mail_queue_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"error" text,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"sent_at" timestamp,
	"trigger_type" "mail_trigger_type" NOT NULL,
	"trigger_entity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_sent_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"mail_account_id" text NOT NULL,
	"queue_id" integer,
	"gmail_message_id" text,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"subject" text NOT NULL,
	"snippet" text,
	"status" text NOT NULL,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"sent_by_user_id" text,
	"trigger_type" "mail_trigger_type" NOT NULL,
	"trigger_entity_id" text
);
--> statement-breakpoint
ALTER TABLE "mail_account_assignments" ADD CONSTRAINT "mail_account_assignments_mail_account_id_mail_accounts_id_fk" FOREIGN KEY ("mail_account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_account_assignments" ADD CONSTRAINT "mail_account_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_accounts" ADD CONSTRAINT "mail_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_queue" ADD CONSTRAINT "mail_queue_mail_account_id_mail_accounts_id_fk" FOREIGN KEY ("mail_account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_sent_log" ADD CONSTRAINT "mail_sent_log_mail_account_id_mail_accounts_id_fk" FOREIGN KEY ("mail_account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_sent_log" ADD CONSTRAINT "mail_sent_log_queue_id_mail_queue_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."mail_queue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_sent_log" ADD CONSTRAINT "mail_sent_log_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_assignments_account_idx" ON "mail_account_assignments" USING btree ("mail_account_id");--> statement-breakpoint
CREATE INDEX "mail_assignments_role_idx" ON "mail_account_assignments" USING btree ("role") WHERE role IS NOT NULL;--> statement-breakpoint
CREATE INDEX "mail_assignments_user_idx" ON "mail_account_assignments" USING btree ("user_id") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "mail_assignments_account_role_unique" ON "mail_account_assignments" USING btree ("mail_account_id","role") WHERE role IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "mail_assignments_account_user_unique" ON "mail_account_assignments" USING btree ("mail_account_id","user_id") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "mail_accounts_user_id_idx" ON "mail_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mail_accounts_is_primary_idx" ON "mail_accounts" USING btree ("is_primary") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "mail_queue_status_idx" ON "mail_queue" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "mail_queue_account_idx" ON "mail_queue" USING btree ("mail_account_id");--> statement-breakpoint
CREATE INDEX "mail_queue_trigger_idx" ON "mail_queue" USING btree ("trigger_type","trigger_entity_id");--> statement-breakpoint
CREATE INDEX "mail_sent_log_account_idx" ON "mail_sent_log" USING btree ("mail_account_id");--> statement-breakpoint
CREATE INDEX "mail_sent_log_sent_at_idx" ON "mail_sent_log" USING btree ("sent_at" DESC);--> statement-breakpoint
CREATE INDEX "mail_sent_log_trigger_idx" ON "mail_sent_log" USING btree ("trigger_type","trigger_entity_id");