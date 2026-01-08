CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'under_review', 'accepted_first_choice', 'accepted_second_choice', 'rejected', 'waitlisted');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('certificate', 'identity', 'proof_of_payment');--> statement-breakpoint
CREATE TYPE "public"."document_verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."result_classification" AS ENUM('Distinction', 'Merit', 'Credit', 'Pass', 'Fail');--> statement-breakpoint
CREATE TYPE "public"."standard_grade" AS ENUM('A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U');--> statement-breakpoint
CREATE TABLE "intake_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"application_fee" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certificate_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"lqf_level" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "certificate_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "grade_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"certificate_type_id" integer NOT NULL,
	"original_grade" text NOT NULL,
	"standard_grade" "standard_grade" NOT NULL,
	CONSTRAINT "uq_grade_mappings_cert_grade" UNIQUE("certificate_type_id","original_grade")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "entry_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"certificate_type_id" integer NOT NULL,
	"rules" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_entry_requirements_program_cert" UNIQUE("program_id","certificate_type_id")
);
--> statement-breakpoint
CREATE TABLE "applicant_phones" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"phone_number" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"national_id" text,
	"nationality" text NOT NULL,
	"birth_place" text,
	"religion" text,
	"address" text,
	"gender" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "applicants_nationalId_unique" UNIQUE("national_id")
);
--> statement-breakpoint
CREATE TABLE "guardian_phones" (
	"id" serial PRIMARY KEY NOT NULL,
	"guardian_id" integer NOT NULL,
	"phone_number" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"address" text,
	"occupation" text,
	"company_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"certificate_type_id" integer NOT NULL,
	"exam_year" integer NOT NULL,
	"institution_name" text NOT NULL,
	"qualification_name" text,
	"result_classification" "result_classification",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_record_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"original_grade" text NOT NULL,
	"standard_grade" "standard_grade" NOT NULL,
	CONSTRAINT "uq_subject_grades_record_subject" UNIQUE("academic_record_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "applicant_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"category" "document_category" NOT NULL,
	"verification_status" "document_verification_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"upload_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"receipt_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" text,
	"notes" text,
	"rejection_reason" text,
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicant_id" text NOT NULL,
	"intake_period_id" integer NOT NULL,
	"first_choice_program_id" integer NOT NULL,
	"second_choice_program_id" integer,
	"status" "application_status" DEFAULT 'submitted' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"created_by" text,
	"application_date" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_applications_applicant_intake" UNIQUE("applicant_id","intake_period_id")
);
--> statement-breakpoint
ALTER TABLE "grade_mappings" ADD CONSTRAINT "grade_mappings_certificate_type_id_certificate_types_id_fk" FOREIGN KEY ("certificate_type_id") REFERENCES "public"."certificate_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_requirements" ADD CONSTRAINT "entry_requirements_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_requirements" ADD CONSTRAINT "entry_requirements_certificate_type_id_certificate_types_id_fk" FOREIGN KEY ("certificate_type_id") REFERENCES "public"."certificate_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_phones" ADD CONSTRAINT "applicant_phones_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_phones" ADD CONSTRAINT "guardian_phones_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_records" ADD CONSTRAINT "academic_records_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_records" ADD CONSTRAINT "academic_records_certificate_type_id_certificate_types_id_fk" FOREIGN KEY ("certificate_type_id") REFERENCES "public"."certificate_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_academic_record_id_academic_records_id_fk" FOREIGN KEY ("academic_record_id") REFERENCES "public"."academic_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_documents" ADD CONSTRAINT "applicant_documents_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_receipts" ADD CONSTRAINT "application_receipts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_receipts" ADD CONSTRAINT "application_receipts_receipt_id_payment_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."payment_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_intake_period_id_intake_periods_id_fk" FOREIGN KEY ("intake_period_id") REFERENCES "public"."intake_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_first_choice_program_id_programs_id_fk" FOREIGN KEY ("first_choice_program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_second_choice_program_id_programs_id_fk" FOREIGN KEY ("second_choice_program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fk_grade_mappings_cert_type" ON "grade_mappings" USING btree ("certificate_type_id");--> statement-breakpoint
CREATE INDEX "fk_entry_requirements_program" ON "entry_requirements" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "fk_entry_requirements_cert_type" ON "entry_requirements" USING btree ("certificate_type_id");--> statement-breakpoint
CREATE INDEX "fk_applicant_phones_applicant" ON "applicant_phones" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "fk_guardian_phones_guardian" ON "guardian_phones" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "fk_guardians_applicant" ON "guardians" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "fk_academic_records_applicant" ON "academic_records" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "fk_academic_records_cert_type" ON "academic_records" USING btree ("certificate_type_id");--> statement-breakpoint
CREATE INDEX "fk_subject_grades_record" ON "subject_grades" USING btree ("academic_record_id");--> statement-breakpoint
CREATE INDEX "fk_subject_grades_subject" ON "subject_grades" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "fk_applicant_documents_applicant" ON "applicant_documents" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "idx_applicant_documents_category" ON "applicant_documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_applicant_documents_status" ON "applicant_documents" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "fk_application_notes_app" ON "application_notes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "fk_application_notes_user" ON "application_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "fk_application_receipts_app" ON "application_receipts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "fk_application_receipts_receipt" ON "application_receipts" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "fk_app_status_history_app" ON "application_status_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "fk_app_status_history_user" ON "application_status_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "fk_applications_applicant" ON "applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "fk_applications_intake" ON "applications" USING btree ("intake_period_id");--> statement-breakpoint
CREATE INDEX "fk_applications_first_choice" ON "applications" USING btree ("first_choice_program_id");--> statement-breakpoint
CREATE INDEX "fk_applications_second_choice" ON "applications" USING btree ("second_choice_program_id");--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_applications_payment_status" ON "applications" USING btree ("payment_status");