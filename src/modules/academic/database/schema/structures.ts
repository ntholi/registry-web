import {
	char,
	index,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { programs } from './schools';

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
