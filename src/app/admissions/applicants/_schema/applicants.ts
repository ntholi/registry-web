import { users } from '@auth/users/_schema/users';
import { date, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const applicants = pgTable(
	'applicants',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		userId: text()
			.references(() => users.id, { onDelete: 'set null' })
			.unique(),
		fullName: text().notNull(),
		dateOfBirth: date({ mode: 'string' }).notNull(),
		nationalId: text().unique(),
		nationality: text().notNull(),
		birthPlace: text(),
		religion: text(),
		address: text(),
		gender: text().notNull(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		userIdx: index('fk_applicants_user').on(table.userId),
	})
);
