import { users } from '@auth/_database';
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
	lecturerGradebookAccess: boolean().notNull().default(false),
	gradebookOpenDate: date({ mode: 'string' }),
	gradebookCloseDate: date({ mode: 'string' }),
	registrationStartDate: date({ mode: 'string' }),
	registrationEndDate: date({ mode: 'string' }),
	createdAt: timestamp().defaultNow(),
	createdBy: text().references(() => users.id, { onDelete: 'set null' }),
	updatedAt: timestamp(),
	updatedBy: text().references(() => users.id, { onDelete: 'set null' }),
});
