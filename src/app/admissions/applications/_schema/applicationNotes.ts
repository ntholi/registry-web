import { users } from '@auth/users/_schema/users';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { applications } from './applications';

export const applicationNotes = pgTable(
	'application_notes',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicationId: text()
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
