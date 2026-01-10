import {
	boolean,
	index,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { moduleStatusEnum, moduleType } from './enums';
import { structureSemesters } from './structures';

export const modules = pgTable('modules', {
	id: serial().primaryKey(),
	cmsId: integer().unique(),
	code: text().notNull(),
	name: text().notNull(),
	status: moduleStatusEnum().notNull().default('Active'),
	remark: text(),
	timestamp: text(),
});

export const semesterModules = pgTable(
	'semester_modules',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
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
		cmsId: integer().unique(),
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
