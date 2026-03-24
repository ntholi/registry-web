CREATE TABLE "letter_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"org" text NOT NULL,
	"address" text,
	"city" text,
	"popularity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "salutation" text DEFAULT 'Dear Sir/Madam,' NOT NULL;--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "recipient_id" text;--> statement-breakpoint
ALTER TABLE "letter_templates" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "letter_templates" ADD COLUMN "salutation" text DEFAULT 'Dear Sir/Madam,' NOT NULL;--> statement-breakpoint
ALTER TABLE "letter_templates" ADD COLUMN "sign_off_name" text;--> statement-breakpoint
ALTER TABLE "letter_templates" ADD COLUMN "sign_off_title" text;--> statement-breakpoint
ALTER TABLE "letter_recipients" ADD CONSTRAINT "letter_recipients_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_recipient_id_letter_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."letter_recipients"("id") ON DELETE set null ON UPDATE no action;