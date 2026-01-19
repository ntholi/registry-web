import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { subjects } from './subjects';

export const subjectAliases = pgTable('subject_aliases', {
	id: serial().primaryKey(),
	subjectId: integer()
		.notNull()
		.references(() => subjects.id, { onDelete: 'cascade' }),
	alias: text().notNull().unique(),
	createdAt: timestamp().defaultNow(),
});
