CREATE TABLE "mail_trigger_settings" (
	"trigger_type" "mail_trigger_type" PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
