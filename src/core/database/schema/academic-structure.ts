import {
	boolean,
	char,
	index,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { moduleStatusEnum, moduleType, programLevelEnum } from './enums';

export const schools = pgTable('schools', {
	id: serial().primaryKey(),
	code: text().notNull().unique(),
	name: text().notNull(),
	isActive: boolean().notNull().default(true),
	createdAt: timestamp().defaultNow(),
});

export const programs = pgTable(
	'programs',
	{
		id: serial().primaryKey(),
		code: text().notNull().unique(),
		name: text().notNull(),
		level: programLevelEnum().notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		schoolIdIdx: index('fk_programs_school_id').on(table.schoolId),
	})
);

export const structures = pgTable(
	'structures',
	{
		id: serial().primaryKey(),
		code: text().notNull().unique(),
		desc: text(),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		programIdIdx: index('fk_structures_program_id').on(table.programId),
	})
);

export const structureSemesters = pgTable('structure_semesters', {
	id: serial().primaryKey(),
	structureId: integer()
		.references(() => structures.id, { onDelete: 'cascade' })
		.notNull(),
	semesterNumber: char({ length: 2 }).notNull(),
	name: text().notNull(),
	totalCredits: real().notNull(),
	createdAt: timestamp().defaultNow(),
});

export const modules = pgTable('modules', {
	id: serial().primaryKey(),
	code: text().notNull(),
	name: text().notNull(),
	status: moduleStatusEnum().notNull().default('Active'),
	timestamp: text(),
});

export const semesterModules = pgTable(
	'semester_modules',
	{
		id: serial().primaryKey(),
		moduleId: integer()
			.notNull()
			.references(() => modules.id),
		type: moduleType().notNull(),
		credits: real().notNull(),
		semesterId: integer().references(() => structureSemesters.id, {
			onDelete: 'set null',
		}),
		hidden: boolean().notNull().default(false),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		moduleIdIdx: index('fk_semester_modules_module_id').on(table.moduleId),
		semesterIdIdx: index('fk_semester_modules_semester_id').on(
			table.semesterId
		),
	})
);

export const modulePrerequisites = pgTable(
	'module_prerequisites',
	{
		id: serial().primaryKey(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		prerequisiteId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniquePrerequisite: unique().on(
			table.semesterModuleId,
			table.prerequisiteId
		),
	})
);

export const terms = pgTable('terms', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	isActive: boolean().notNull().default(false),
	semester: integer().notNull(),
	createdAt: timestamp().defaultNow(),
});
