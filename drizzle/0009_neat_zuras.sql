ALTER TABLE "student_education" ALTER COLUMN "level" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."education_level";--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('JCE', 'BJCE', 'BGGSE', 'LGCSE', 'IGCSE', 'O-Levels', 'A-Levels', 'Matriculation', 'Cambridge Oversea School Certificate', 'Certificate', 'Diploma', 'Degree', 'Masters', 'Doctorate', 'Others');--> statement-breakpoint
ALTER TABLE "student_education" ALTER COLUMN "level" SET DATA TYPE "public"."education_level" USING "level"::"public"."education_level";