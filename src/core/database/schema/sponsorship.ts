import {
	bigint,
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';
import { terms } from './academic-structure';
import { students } from './students';

export const sponsors = pgTable('sponsors', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	code: varchar({ length: 10 }).notNull().unique(),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp(),
});

export const sponsoredStudents = pgTable(
	'sponsored_students',
	{
		id: serial().primaryKey(),
		sponsorId: integer()
			.references(() => sponsors.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		borrowerNo: text(),
		bankName: text(),
		accountNumber: text(),
		confirmed: boolean().default(false),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp(),
	},
	(table) => ({
		uniqueSponsoredStudent: unique().on(table.sponsorId, table.stdNo),
		sponsorIdIdx: index('fk_sponsored_students_sponsor_id').on(table.sponsorId),
		stdNoIdx: index('fk_sponsored_students_std_no').on(table.stdNo),
	})
);

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
