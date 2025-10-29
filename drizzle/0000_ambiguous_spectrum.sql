CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_marks" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"marks" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_marks_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_mark_id" integer,
	"action" text NOT NULL,
	"previous_marks" real,
	"new_marks" real,
	"created_by" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"term_id" integer NOT NULL,
	"assessment_number" text NOT NULL,
	"assessment_type" text NOT NULL,
	"total_marks" real NOT NULL,
	"weight" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "assessments_moduleId_assessmentNumber_termId_unique" UNIQUE("module_id","assessment_number","term_id")
);
--> statement-breakpoint
CREATE TABLE "assessments_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer,
	"action" text NOT NULL,
	"previous_assessment_number" text,
	"new_assessment_number" text,
	"previous_assessment_type" text,
	"new_assessment_type" text,
	"previous_total_marks" real,
	"new_total_marks" real,
	"previous_weight" real,
	"new_weight" real,
	"created_by" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assigned_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"term_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"user_id" text NOT NULL,
	"semester_module_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" text NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credentialID_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "blocked_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'blocked' NOT NULL,
	"reason" text NOT NULL,
	"by_department" text NOT NULL,
	"std_no" bigint NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clearance" (
	"id" serial PRIMARY KEY NOT NULL,
	"department" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"email_sent" boolean DEFAULT false NOT NULL,
	"responded_by" text,
	"response_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clearance_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"clearance_id" integer NOT NULL,
	"previous_status" text,
	"new_status" text NOT NULL,
	"created_by" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"message" text,
	"modules" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"type" text,
	"std_no" bigint NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fortinet_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"school_id" integer NOT NULL,
	"level" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "fortinet_registrations_stdNo_level_unique" UNIQUE("std_no","level")
);
--> statement-breakpoint
CREATE TABLE "graduation_clearance" (
	"id" serial PRIMARY KEY NOT NULL,
	"graduation_request_id" integer NOT NULL,
	"clearance_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "graduation_clearance_clearanceId_unique" UNIQUE("clearance_id")
);
--> statement-breakpoint
CREATE TABLE "graduation_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Graduation List' NOT NULL,
	"spreadsheet_id" text,
	"spreadsheet_url" text,
	"status" text DEFAULT 'created' NOT NULL,
	"created_by" text,
	"populated_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "graduation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_program_id" integer NOT NULL,
	"information_confirmed" boolean DEFAULT false NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "graduation_requests_studentProgramId_unique" UNIQUE("student_program_id")
);
--> statement-breakpoint
CREATE TABLE "module_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"grade" text NOT NULL,
	"weighted_total" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "module_grades_moduleId_stdNo_unique" UNIQUE("module_id","std_no")
);
--> statement-breakpoint
CREATE TABLE "module_prerequisites" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_module_id" integer NOT NULL,
	"prerequisite_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "module_prerequisites_semesterModuleId_prerequisiteId_unique" UNIQUE("semester_module_id","prerequisite_id")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"timestamp" text
);
--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"graduation_request_id" integer NOT NULL,
	"payment_type" text NOT NULL,
	"receipt_no" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_receipts_receiptNo_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"level" text NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "registration_clearance" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_request_id" integer NOT NULL,
	"clearance_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "registration_clearance_registrationRequestId_clearanceId_unique" UNIQUE("registration_request_id","clearance_id")
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsor_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"term_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"mail_sent" boolean DEFAULT false NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"semester_status" text NOT NULL,
	"semester_number" integer NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"date_approved" timestamp,
	CONSTRAINT "registration_requests_stdNo_termId_unique" UNIQUE("std_no","term_id")
);
--> statement-breakpoint
CREATE TABLE "requested_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_status" text DEFAULT 'Compulsory' NOT NULL,
	"registration_request_id" integer NOT NULL,
	"semester_module_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "schools_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "semester_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer,
	"type" text NOT NULL,
	"credits" real NOT NULL,
	"semester_id" integer,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signups" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"std_no" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text DEFAULT 'Pending approval',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sponsored_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsor_id" integer NOT NULL,
	"std_no" bigint NOT NULL,
	"borrower_no" text,
	"bank_name" text,
	"account_number" text,
	"confirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "sponsored_students_sponsorId_stdNo_unique" UNIQUE("sponsor_id","std_no")
);
--> statement-breakpoint
CREATE TABLE "sponsored_terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"sponsored_student_id" integer NOT NULL,
	"term_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "sponsored_terms_sponsoredStudentId_termId_unique" UNIQUE("sponsored_student_id","term_id")
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "sponsors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "statement_of_results_prints" (
	"id" text PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"printed_by" text NOT NULL,
	"student_name" text NOT NULL,
	"program_name" text NOT NULL,
	"total_credits" integer NOT NULL,
	"total_modules" integer NOT NULL,
	"cgpa" real,
	"classification" text,
	"academic_status" text,
	"graduation_date" text,
	"printed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "structure_semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"structure_id" integer NOT NULL,
	"semester_number" integer NOT NULL,
	"name" text NOT NULL,
	"total_credits" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"desc" text,
	"program_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "structures_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "student_card_prints" (
	"id" text PRIMARY KEY NOT NULL,
	"receipt_no" text NOT NULL,
	"std_no" bigint NOT NULL,
	"printed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "student_card_prints_receiptNo_unique" UNIQUE("receipt_no")
);
--> statement-breakpoint
CREATE TABLE "student_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_module_id" integer NOT NULL,
	"status" text NOT NULL,
	"marks" text NOT NULL,
	"grade" text NOT NULL,
	"student_semester_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"intake_date" text,
	"reg_date" text,
	"start_term" text,
	"structure_id" integer NOT NULL,
	"stream" text,
	"graduation_date" text,
	"status" text NOT NULL,
	"assist_provider" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"semester_number" integer,
	"status" text NOT NULL,
	"student_program_id" integer NOT NULL,
	"caf_date" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"std_no" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"national_id" text NOT NULL,
	"sem" integer NOT NULL,
	"date_of_birth" timestamp,
	"phone1" text,
	"phone2" text,
	"gender" text,
	"marital_status" text,
	"religion" text,
	"user_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "task_assignments_taskId_userId_unique" UNIQUE("task_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"department" text NOT NULL,
	"created_by" text NOT NULL,
	"scheduled_for" timestamp,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"semester" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "terms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "transcript_prints" (
	"id" text PRIMARY KEY NOT NULL,
	"std_no" bigint NOT NULL,
	"printed_by" text NOT NULL,
	"student_name" text NOT NULL,
	"program_name" text NOT NULL,
	"total_credits" integer NOT NULL,
	"cgpa" real,
	"printed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_schools_userId_schoolId_unique" UNIQUE("user_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"position" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks_audit" ADD CONSTRAINT "assessment_marks_audit_assessment_mark_id_assessment_marks_id_fk" FOREIGN KEY ("assessment_mark_id") REFERENCES "public"."assessment_marks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks_audit" ADD CONSTRAINT "assessment_marks_audit_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments_audit" ADD CONSTRAINT "assessments_audit_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments_audit" ADD CONSTRAINT "assessments_audit_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assigned_modules" ADD CONSTRAINT "assigned_modules_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assigned_modules" ADD CONSTRAINT "assigned_modules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assigned_modules" ADD CONSTRAINT "assigned_modules_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_students" ADD CONSTRAINT "blocked_students_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance" ADD CONSTRAINT "clearance_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_audit" ADD CONSTRAINT "clearance_audit_clearance_id_clearance_id_fk" FOREIGN KEY ("clearance_id") REFERENCES "public"."clearance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_audit" ADD CONSTRAINT "clearance_audit_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fortinet_registrations" ADD CONSTRAINT "fortinet_registrations_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fortinet_registrations" ADD CONSTRAINT "fortinet_registrations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graduation_clearance" ADD CONSTRAINT "graduation_clearance_graduation_request_id_graduation_requests_id_fk" FOREIGN KEY ("graduation_request_id") REFERENCES "public"."graduation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graduation_clearance" ADD CONSTRAINT "graduation_clearance_clearance_id_clearance_id_fk" FOREIGN KEY ("clearance_id") REFERENCES "public"."clearance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graduation_lists" ADD CONSTRAINT "graduation_lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graduation_requests" ADD CONSTRAINT "graduation_requests_student_program_id_student_programs_id_fk" FOREIGN KEY ("student_program_id") REFERENCES "public"."student_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_grades" ADD CONSTRAINT "module_grades_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_grades" ADD CONSTRAINT "module_grades_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_prerequisites" ADD CONSTRAINT "module_prerequisites_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_prerequisites" ADD CONSTRAINT "module_prerequisites_prerequisite_id_semester_modules_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_graduation_request_id_graduation_requests_id_fk" FOREIGN KEY ("graduation_request_id") REFERENCES "public"."graduation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_clearance" ADD CONSTRAINT "registration_clearance_registration_request_id_registration_requests_id_fk" FOREIGN KEY ("registration_request_id") REFERENCES "public"."registration_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_clearance" ADD CONSTRAINT "registration_clearance_clearance_id_clearance_id_fk" FOREIGN KEY ("clearance_id") REFERENCES "public"."clearance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requested_modules" ADD CONSTRAINT "requested_modules_registration_request_id_registration_requests_id_fk" FOREIGN KEY ("registration_request_id") REFERENCES "public"."registration_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requested_modules" ADD CONSTRAINT "requested_modules_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_modules" ADD CONSTRAINT "semester_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_modules" ADD CONSTRAINT "semester_modules_semester_id_structure_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."structure_semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signups" ADD CONSTRAINT "signups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsored_students" ADD CONSTRAINT "sponsored_students_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsored_students" ADD CONSTRAINT "sponsored_students_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsored_terms" ADD CONSTRAINT "sponsored_terms_sponsored_student_id_sponsored_students_id_fk" FOREIGN KEY ("sponsored_student_id") REFERENCES "public"."sponsored_students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsored_terms" ADD CONSTRAINT "sponsored_terms_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_of_results_prints" ADD CONSTRAINT "statement_of_results_prints_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_of_results_prints" ADD CONSTRAINT "statement_of_results_prints_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structure_semesters" ADD CONSTRAINT "structure_semesters_structure_id_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structures" ADD CONSTRAINT "structures_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_card_prints" ADD CONSTRAINT "student_card_prints_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_card_prints" ADD CONSTRAINT "student_card_prints_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_modules" ADD CONSTRAINT "student_modules_semester_module_id_semester_modules_id_fk" FOREIGN KEY ("semester_module_id") REFERENCES "public"."semester_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_modules" ADD CONSTRAINT "student_modules_student_semester_id_student_semesters_id_fk" FOREIGN KEY ("student_semester_id") REFERENCES "public"."student_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_programs" ADD CONSTRAINT "student_programs_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_programs" ADD CONSTRAINT "student_programs_structure_id_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_student_program_id_student_programs_id_fk" FOREIGN KEY ("student_program_id") REFERENCES "public"."student_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_prints" ADD CONSTRAINT "transcript_prints_std_no_students_std_no_fk" FOREIGN KEY ("std_no") REFERENCES "public"."students"("std_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_prints" ADD CONSTRAINT "transcript_prints_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_schools" ADD CONSTRAINT "user_schools_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_schools" ADD CONSTRAINT "user_schools_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocked_students_std_no_idx" ON "blocked_students" USING btree ("std_no");--> statement-breakpoint
CREATE INDEX "task_assignments_user_id_idx" ON "task_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_department_idx" ON "tasks" USING btree ("department");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");