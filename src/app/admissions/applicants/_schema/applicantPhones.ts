import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { applicants } from './applicants';

export const applicantPhones = pgTable(
	'applicant_phones',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		phoneNumber: text().notNull(),
	},
	(table) => ({
		applicantIdx: index('fk_applicant_phones_applicant').on(table.applicantId),
	})
);
