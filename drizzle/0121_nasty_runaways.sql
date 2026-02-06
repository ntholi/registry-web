CREATE TABLE "registration_request_receipts" (
	"registration_request_id" integer NOT NULL,
	"receipt_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "registration_request_receipts_registrationRequestId_receiptId_unique" UNIQUE("registration_request_id","receipt_id")
);
--> statement-breakpoint
ALTER TABLE "registration_request_receipts" ADD CONSTRAINT "registration_request_receipts_registration_request_id_registration_requests_id_fk" FOREIGN KEY ("registration_request_id") REFERENCES "public"."registration_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_request_receipts" ADD CONSTRAINT "registration_request_receipts_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_registration_request_receipts_registration_request_id" ON "registration_request_receipts" USING btree ("registration_request_id");--> statement-breakpoint
CREATE INDEX "fk_registration_request_receipts_receipt_id" ON "registration_request_receipts" USING btree ("receipt_id");