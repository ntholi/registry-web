import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { schools } from './schools';

export const programLevelEnum = pgEnum('program_level', [
	'certificate',
	'diploma',
	'degree',
]);
export type ProgramLevel = (typeof programLevelEnum.enumValues)[number];

export const programs = pgTable(
	'programs',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		code: text().notNull().unique(),
		name: text().notNull(),
		shortName: text(),
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
