import { sql } from 'drizzle-orm';
import {
	bigint,
	index,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database';
import { grade } from '../../../academic/database/schema/enums';
import { semesterModules } from '../../../academic/database/schema/modules';
import {
	structureSemesters,
	structures,
} from '../../../academic/database/schema/structures';
import {
	educationLevel,
	educationType,
	gender,
	maritalStatusEnum,
	nextOfKinRelationship,
	programStatus,
	semesterStatus,
	studentModuleStatus,
	studentStatus,
} from './enums';

export const students = pgTable(
	'students',
	{
		stdNo: bigint({ mode: 'number' }).primaryKey(),
		name: text().notNull(),
		nationalId: text().notNull(),
		status: studentStatus().notNull().default('Active'),
		dateOfBirth: timestamp({ mode: 'date' }),
		phone1: text(),
		phone2: text(),
		gender: gender(),
		maritalStatus: maritalStatusEnum(),
		country: text(),
		race: text(),
		nationality: text(),
		birthPlace: text(),
		religion: text(),
		userId: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		nameTrigramIdx: index('idx_students_name_trgm').using(
			'gin',
			sql`${table.name} gin_trgm_ops`
		),
		userIdIdx: index('fk_students_user_id').on(table.userId),
	})
);

export const studentEducation = pgTable(
	'student_education',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		schoolName: text().notNull(),
		type: educationType(),
		level: educationLevel(),
		startDate: timestamp({ mode: 'date' }),
		endDate: timestamp({ mode: 'date' }),
		createdAt: timestamp().notNull().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_student_education_std_no').on(table.stdNo),
		schoolNameIdx: index('idx_student_education_school_name').on(
			table.schoolName
		),
	})
);

export const nextOfKins = pgTable(
	'next_of_kins',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		name: text().notNull(),
		relationship: nextOfKinRelationship().notNull(),
		phone: text(),
		email: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_next_of_kins_std_no').on(table.stdNo),
	})
);

export const studentPrograms = pgTable(
	'student_programs',
	{
		id: serial().primaryKey(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		intakeDate: text(),
		regDate: text(),
		startTerm: text(),
		structureId: integer()
			.references(() => structures.id, { onDelete: 'cascade' })
			.notNull(),
		stream: text(),
		graduationDate: text(),
		status: programStatus().notNull(),
		assistProvider: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_student_programs_std_no').on(table.stdNo),
		statusIdx: index('idx_student_programs_status').on(table.status),
		structureIdIdx: index('fk_student_programs_structure_id').on(
			table.structureId
		),
		stdNoStatusIdx: index('idx_student_programs_std_no_status').on(
			table.stdNo,
			table.status
		),
	})
);

export const studentSemesters = pgTable(
	'student_semesters',
	{
		id: serial().primaryKey(),
		term: text().notNull(),
		structureSemesterId: integer()
			.references(() => structureSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		status: semesterStatus().notNull(),
		studentProgramId: integer()
			.references(() => studentPrograms.id, { onDelete: 'cascade' })
			.notNull(),
		sponsorId: integer(),
		cafDate: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentProgramIdIdx: index('fk_student_semesters_student_program_id').on(
			table.studentProgramId
		),
		structureSemesterIdIdx: index(
			'fk_student_semesters_structure_semester_id'
		).on(table.structureSemesterId),
		termIdx: index('idx_student_semesters_term').on(table.term),
		statusIdx: index('idx_student_semesters_status').on(table.status),
		sponsorIdIdx: index('fk_student_semesters_sponsor_id').on(table.sponsorId),
	})
);

export const studentModules = pgTable(
	'student_modules',
	{
		id: serial().primaryKey(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		status: studentModuleStatus().notNull(),
		marks: text().notNull(),
		grade: grade().notNull(),
		credits: real().notNull(),
		studentSemesterId: integer()
			.references(() => studentSemesters.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		studentSemesterIdIdx: index('fk_student_modules_student_semester_id').on(
			table.studentSemesterId
		),
		semesterModuleIdIdx: index('fk_student_modules_semester_module_id').on(
			table.semesterModuleId
		),
		statusIdx: index('idx_student_modules_status').on(table.status),
	})
);
