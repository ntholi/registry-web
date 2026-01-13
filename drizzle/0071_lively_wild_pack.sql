-- ============================================
-- SCHOOLS
-- ============================================
ALTER TABLE "schools" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "schools" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- PROGRAMS
-- ============================================
ALTER TABLE "programs" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "programs" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- STRUCTURES
-- ============================================
ALTER TABLE "structures" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "structures" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "structures" ADD CONSTRAINT "structures_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- STRUCTURE_SEMESTERS
-- ============================================
ALTER TABLE "structure_semesters" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "structure_semesters" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "structure_semesters" ADD CONSTRAINT "structure_semesters_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- MODULES
-- ============================================
ALTER TABLE "modules" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "modules" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- SEMESTER_MODULES
-- ============================================
ALTER TABLE "semester_modules" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "semester_modules" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "semester_modules" ADD CONSTRAINT "semester_modules_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- MODULE_PREREQUISITES
-- ============================================
ALTER TABLE "module_prerequisites" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "module_prerequisites" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "module_prerequisites" ADD CONSTRAINT "module_prerequisites_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- STUDENT_EDUCATION
-- ============================================
ALTER TABLE "student_education" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "student_education" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "student_education" ADD CONSTRAINT "student_education_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- NEXT_OF_KINS
-- ============================================
ALTER TABLE "next_of_kins" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "next_of_kins" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "next_of_kins" ADD CONSTRAINT "next_of_kins_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- STUDENT_PROGRAMS
-- ============================================
ALTER TABLE "student_programs" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "student_programs" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "student_programs" ADD CONSTRAINT "student_programs_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- STUDENT_SEMESTERS
-- ============================================
ALTER TABLE "student_semesters" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "student_semesters" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "student_semesters" ADD CONSTRAINT "student_semesters_cmsId_unique" UNIQUE("cms_id");--> statement-breakpoint

-- ============================================
-- STUDENT_MODULES
-- ============================================
ALTER TABLE "student_modules" ADD COLUMN "cms_id" integer;--> statement-breakpoint
UPDATE "student_modules" SET "cms_id" = "id";--> statement-breakpoint
ALTER TABLE "student_modules" ADD CONSTRAINT "student_modules_cmsId_unique" UNIQUE("cms_id");