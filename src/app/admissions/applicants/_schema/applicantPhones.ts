import { index, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { applicants } from './applicants';

export const applicantPhones = pgTable(
	'applicant_phones',
	{
		id: serial().primaryKey(),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		phoneNumber: text().notNull(),
	},
	(table) => ({
		applicantIdx: index('fk_applicant_phones_applicant').on(table.applicantId),
	})
);
