import { schools } from '@academic/schools/_schema/schools';
import { users } from '@auth/users/_schema/users';
import {
	date,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { terms } from './terms';

export const termRegistrations = pgTable(
	'term_registrations',
	{
		id: serial().primaryKey(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		schoolId: integer()
			.references(() => schools.id, { onDelete: 'cascade' })
			.notNull(),
		startDate: date({ mode: 'string' }).notNull(),
		endDate: date({ mode: 'string' }).notNull(),
		createdAt: timestamp().defaultNow(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
	},
	(table) => ({
		uniqueTermSchool: unique().on(table.termId, table.schoolId),
		termIdIdx: index('fk_term_registrations_term_id').on(table.termId),
		schoolIdIdx: index('fk_term_registrations_school_id').on(table.schoolId),
	})
);
