import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/core/database';
import { applications } from './applications';

export const applicationNotes = pgTable(
	'application_notes',
	{
		id: serial().primaryKey(),
		applicationId: integer()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		content: text().notNull(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_application_notes_app').on(table.applicationId),
		createdByIdx: index('fk_application_notes_user').on(table.createdBy),
	})
);
