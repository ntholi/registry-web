import { users } from '@auth/users/_schema/users';
import {
	boolean,
	date,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { terms } from './terms';

export const termSettings = pgTable('term_settings', {
	id: serial().primaryKey(),
	termId: integer()
		.references(() => terms.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	resultsPublished: boolean().notNull().default(false),
	lecturerGradebookAccess: boolean().notNull().default(true),
	registrationStartDate: date({ mode: 'string' }),
	registrationEndDate: date({ mode: 'string' }),
	createdAt: timestamp().defaultNow(),
	createdBy: text().references(() => users.id, { onDelete: 'set null' }),
	updatedAt: timestamp(),
	updatedBy: text().references(() => users.id, { onDelete: 'set null' }),
});
