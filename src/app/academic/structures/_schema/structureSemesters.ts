import {
	char,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { structures } from './structures';

export const structureSemesters = pgTable('structure_semesters', {
	id: serial().primaryKey(),
	cmsId: integer().unique(),
	structureId: integer()
		.references(() => structures.id, { onDelete: 'cascade' })
		.notNull(),
	semesterNumber: char({ length: 2 }).notNull(),
	name: text().notNull(),
	totalCredits: real().notNull(),
	createdAt: timestamp().defaultNow(),
});
