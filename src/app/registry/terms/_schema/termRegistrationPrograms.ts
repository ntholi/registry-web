import { programs } from '@academic/schools/_schema/programs';
import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { termRegistrations } from './termRegistrations';

export const termRegistrationPrograms = pgTable(
	'term_registration_programs',
	{
		id: serial().primaryKey(),
		termRegistrationId: integer()
			.references(() => termRegistrations.id, { onDelete: 'cascade' })
			.notNull(),
		programId: integer()
			.references(() => programs.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueRegistrationProgram: unique().on(
			table.termRegistrationId,
			table.programId
		),
		termRegistrationIdIdx: index(
			'fk_term_registration_programs_term_registration_id'
		).on(table.termRegistrationId),
		programIdIdx: index('fk_term_registration_programs_program_id').on(
			table.programId
		),
	})
);
