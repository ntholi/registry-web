import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { subjects } from './subjects';

export const subjectAliases = pgTable('subject_aliases', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	subjectId: text()
		.notNull()
		.references(() => subjects.id, { onDelete: 'cascade' }),
	alias: text().notNull().unique(),
	createdAt: timestamp().defaultNow(),
});
