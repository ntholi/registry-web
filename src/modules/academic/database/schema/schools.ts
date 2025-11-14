import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { programLevelEnum } from './enums';

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
