import { modules } from '@academic/modules/_schema/modules';
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	timestamp,
} from 'drizzle-orm/pg-core';

export const moduleType = pgEnum('module_type', [
	'Major',
	'Minor',
	'Core',
	'Delete',
	'Elective',
]);
export type ModuleType = (typeof moduleType.enumValues)[number];

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
