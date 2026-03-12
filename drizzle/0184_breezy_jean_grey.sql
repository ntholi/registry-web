CREATE TABLE "lms_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lms_user_id" integer,
	"lms_token" text,
	CONSTRAINT "lms_credentials_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "permission_presets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permission_presets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "preset_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"preset_id" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	CONSTRAINT "preset_permissions_preset_id_resource_action_unique" UNIQUE("preset_id","resource","action")
);
--> statement-breakpoint
ALTER TABLE "lms_credentials" ADD CONSTRAINT "lms_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preset_permissions" ADD CONSTRAINT "preset_permissions_preset_id_permission_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "public"."permission_presets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_preset_permissions_preset_id" ON "preset_permissions" USING btree ("preset_id");