import { terms } from '@registry/terms/_schema/terms';
import {
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { sponsoredStudents } from './sponsoredStudents';

export const sponsoredTerms = pgTable(
	'sponsored_terms',
	{
		id: serial().primaryKey(),
		sponsoredStudentId: integer()
			.references(() => sponsoredStudents.id, { onDelete: 'cascade' })
			.notNull(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueSponsoredTerm: unique().on(table.sponsoredStudentId, table.termId),
		sponsoredStudentIdIdx: index('fk_sponsored_terms_sponsored_student_id').on(
			table.sponsoredStudentId
		),
		termIdIdx: index('fk_sponsored_terms_term_id').on(table.termId),
	})
);
