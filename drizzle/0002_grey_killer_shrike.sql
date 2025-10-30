CREATE TYPE "public"."assessment_marks_audit_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."assessment_number" AS ENUM('CW1', 'CW2', 'CW3', 'CW4', 'CW5', 'CW6', 'CW7', 'CW8', 'CW9', 'CW10', 'CW11', 'CW12', 'CW13', 'CW14', 'CW15');--> statement-breakpoint
CREATE TYPE "public"."assessments_audit_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."blocked_student_status" AS ENUM('blocked', 'unblocked');--> statement-breakpoint
CREATE TYPE "public"."clearance_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."dashboard_users" AS ENUM('finance', 'registry', 'library', 'resource', 'academic', 'admin');--> statement-breakpoint
CREATE TYPE "public"."fortinet_level" AS ENUM('nse1', 'nse2', 'nse3', 'nse4', 'nse5', 'nse6', 'nse7', 'nse8');--> statement-breakpoint
CREATE TYPE "public"."fortinet_registration_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('Male', 'Female', 'Other');--> statement-breakpoint
CREATE TYPE "public"."grade" AS ENUM('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'F', 'PC', 'PX', 'AP', 'X', 'Def', 'GNS', 'ANN', 'FIN', 'FX', 'DNC', 'DNA', 'PP', 'DNS', 'EXP', 'NM');--> statement-breakpoint
CREATE TYPE "public"."graduation_list_status" AS ENUM('created', 'populated', 'archived');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('Single', 'Married', 'Divorced', 'Windowed');--> statement-breakpoint
CREATE TYPE "public"."module_status" AS ENUM('Active', 'Defunct');--> statement-breakpoint
CREATE TYPE "public"."module_type" AS ENUM('Major', 'Minor', 'Core', 'Delete', 'Elective');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('graduation_gown', 'graduation_fee');--> statement-breakpoint
CREATE TYPE "public"."program_level" AS ENUM('certificate', 'diploma', 'degree');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('Active', 'Changed', 'Completed', 'Deleted', 'Inactive');--> statement-breakpoint
CREATE TYPE "public"."registration_request_status" AS ENUM('pending', 'approved', 'rejected', 'partial', 'registered');--> statement-breakpoint
CREATE TYPE "public"."requested_module_status" AS ENUM('pending', 'registered', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."semester_status" AS ENUM('Active', 'Outstanding', 'Deferred', 'Deleted', 'DNR', 'DroppedOut', 'Withdrawn', 'Enrolled', 'Exempted', 'Inactive', 'Repeat');--> statement-breakpoint
CREATE TYPE "public"."semester_status_for_registration" AS ENUM('Active', 'Repeat');--> statement-breakpoint
CREATE TYPE "public"."signup_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."student_module_status" AS ENUM('Add', 'Compulsory', 'Delete', 'Drop', 'Exempted', 'Ineligible', 'Repeat1', 'Repeat2', 'Repeat3', 'Repeat4', 'Repeat5', 'Repeat6', 'Repeat7', 'Resit1', 'Resit2', 'Resit3', 'Resit4', 'Supplementary');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('scheduled', 'active', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_positions" AS ENUM('manager', 'program_leader', 'principal_lecturer', 'year_leader', 'lecturer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('user', 'student', 'finance', 'registry', 'library', 'resource', 'academic', 'admin');--> statement-breakpoint
ALTER TABLE "assessment_marks_audit" ALTER COLUMN "action" SET DATA TYPE "public"."assessment_marks_audit_action" USING "action"::"public"."assessment_marks_audit_action";--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "assessment_number" SET DATA TYPE "public"."assessment_number" USING "assessment_number"::"public"."assessment_number";--> statement-breakpoint
ALTER TABLE "assessments_audit" ALTER COLUMN "action" SET DATA TYPE "public"."assessments_audit_action" USING "action"::"public"."assessments_audit_action";--> statement-breakpoint
ALTER TABLE "assessments_audit" ALTER COLUMN "previous_assessment_number" SET DATA TYPE "public"."assessment_number" USING "previous_assessment_number"::"public"."assessment_number";--> statement-breakpoint
ALTER TABLE "assessments_audit" ALTER COLUMN "new_assessment_number" SET DATA TYPE "public"."assessment_number" USING "new_assessment_number"::"public"."assessment_number";--> statement-breakpoint
ALTER TABLE "blocked_students" ALTER COLUMN "status" SET DEFAULT 'blocked'::"public"."blocked_student_status";--> statement-breakpoint
ALTER TABLE "blocked_students" ALTER COLUMN "status" SET DATA TYPE "public"."blocked_student_status" USING "status"::"public"."blocked_student_status";--> statement-breakpoint
ALTER TABLE "blocked_students" ALTER COLUMN "by_department" SET DATA TYPE "public"."dashboard_users" USING "by_department"::"public"."dashboard_users";--> statement-breakpoint
ALTER TABLE "clearance" ALTER COLUMN "department" SET DATA TYPE "public"."dashboard_users" USING "department"::"public"."dashboard_users";--> statement-breakpoint
ALTER TABLE "clearance" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."clearance_request_status";--> statement-breakpoint
ALTER TABLE "clearance" ALTER COLUMN "status" SET DATA TYPE "public"."clearance_request_status" USING "status"::"public"."clearance_request_status";--> statement-breakpoint
ALTER TABLE "clearance_audit" ALTER COLUMN "previous_status" SET DATA TYPE "public"."registration_request_status" USING "previous_status"::"public"."registration_request_status";--> statement-breakpoint
ALTER TABLE "clearance_audit" ALTER COLUMN "new_status" SET DATA TYPE "public"."registration_request_status" USING "new_status"::"public"."registration_request_status";--> statement-breakpoint
ALTER TABLE "fortinet_registrations" ALTER COLUMN "level" SET DATA TYPE "public"."fortinet_level" USING "level"::"public"."fortinet_level";--> statement-breakpoint
ALTER TABLE "fortinet_registrations" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."fortinet_registration_status";--> statement-breakpoint
ALTER TABLE "fortinet_registrations" ALTER COLUMN "status" SET DATA TYPE "public"."fortinet_registration_status" USING "status"::"public"."fortinet_registration_status";--> statement-breakpoint
ALTER TABLE "graduation_lists" ALTER COLUMN "status" SET DEFAULT 'created'::"public"."graduation_list_status";--> statement-breakpoint
ALTER TABLE "graduation_lists" ALTER COLUMN "status" SET DATA TYPE "public"."graduation_list_status" USING "status"::"public"."graduation_list_status";--> statement-breakpoint
ALTER TABLE "module_grades" ALTER COLUMN "grade" SET DATA TYPE "public"."grade" USING "grade"::"public"."grade";--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "status" SET DEFAULT 'Active'::"public"."module_status";--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "status" SET DATA TYPE "public"."module_status" USING "status"::"public"."module_status";--> statement-breakpoint
ALTER TABLE "payment_receipts" ALTER COLUMN "payment_type" SET DATA TYPE "public"."payment_type" USING "payment_type"::"public"."payment_type";--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "level" SET DATA TYPE "public"."program_level" USING "level"::"public"."program_level";--> statement-breakpoint
ALTER TABLE "registration_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."registration_request_status";--> statement-breakpoint
ALTER TABLE "registration_requests" ALTER COLUMN "status" SET DATA TYPE "public"."registration_request_status" USING "status"::"public"."registration_request_status";--> statement-breakpoint
ALTER TABLE "registration_requests" ALTER COLUMN "semester_status" SET DATA TYPE "public"."semester_status_for_registration" USING "semester_status"::"public"."semester_status_for_registration";--> statement-breakpoint
ALTER TABLE "requested_modules" ALTER COLUMN "module_status" SET DEFAULT 'Compulsory'::"public"."student_module_status";--> statement-breakpoint
ALTER TABLE "requested_modules" ALTER COLUMN "module_status" SET DATA TYPE "public"."student_module_status" USING "module_status"::"public"."student_module_status";--> statement-breakpoint
ALTER TABLE "requested_modules" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."requested_module_status";--> statement-breakpoint
ALTER TABLE "requested_modules" ALTER COLUMN "status" SET DATA TYPE "public"."requested_module_status" USING "status"::"public"."requested_module_status";--> statement-breakpoint
ALTER TABLE "semester_modules" ALTER COLUMN "type" SET DATA TYPE "public"."module_type" USING "type"::"public"."module_type";--> statement-breakpoint
ALTER TABLE "signups" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."signup_status";--> statement-breakpoint
ALTER TABLE "signups" ALTER COLUMN "status" SET DATA TYPE "public"."signup_status" USING "status"::"public"."signup_status";--> statement-breakpoint
ALTER TABLE "student_modules" ALTER COLUMN "status" SET DATA TYPE "public"."student_module_status" USING "status"::"public"."student_module_status";--> statement-breakpoint
ALTER TABLE "student_modules" ALTER COLUMN "grade" SET DATA TYPE "public"."grade" USING "grade"::"public"."grade";--> statement-breakpoint
ALTER TABLE "student_programs" ALTER COLUMN "status" SET DATA TYPE "public"."program_status" USING "status"::"public"."program_status";--> statement-breakpoint
ALTER TABLE "student_semesters" ALTER COLUMN "status" SET DATA TYPE "public"."semester_status" USING "status"::"public"."semester_status";--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "gender" SET DATA TYPE "public"."gender" USING "gender"::"public"."gender";--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "marital_status" SET DATA TYPE "public"."marital_status" USING "marital_status"::"public"."marital_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING "status"::"public"."task_status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'medium'::"public"."task_priority";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DATA TYPE "public"."task_priority" USING "priority"::"public"."task_priority";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "department" SET DATA TYPE "public"."dashboard_users" USING "department"::"public"."dashboard_users";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_roles";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_roles" USING "role"::"public"."user_roles";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "position" SET DATA TYPE "public"."user_positions" USING "position"::"public"."user_positions";