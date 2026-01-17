import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { applicants } from './applicants';

export const guardians = pgTable(
	'guardians',
	{
		id: serial().primaryKey(),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		name: text().notNull(),
		relationship: text().notNull(),
		address: text(),
		occupation: text(),
		companyName: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicantIdx: index('fk_guardians_applicant').on(table.applicantId),
	})
);
