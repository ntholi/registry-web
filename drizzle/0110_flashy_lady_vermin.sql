CREATE TABLE "bank_deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"document_id" text NOT NULL,
	"reference" text NOT NULL,
	"beneficiary_name" text,
	"date_deposited" text,
	"amount_deposited" numeric(10, 2),
	"currency" text,
	"depositor_name" text,
	"bank_name" text,
	"transaction_number" text,
	"terminal_number" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD CONSTRAINT "bank_deposits_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_deposits" ADD CONSTRAINT "bank_deposits_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_bank_deposits_application" ON "bank_deposits" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_bank_deposits_reference" ON "bank_deposits" USING btree ("reference");