import {
	date,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const applicants = pgTable('applicants', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
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
});

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

export const guardianPhones = pgTable(
	'guardian_phones',
	{
		id: serial().primaryKey(),
		guardianId: integer()
			.references(() => guardians.id, { onDelete: 'cascade' })
			.notNull(),
		phoneNumber: text().notNull(),
	},
	(table) => ({
		guardianIdx: index('fk_guardian_phones_guardian').on(table.guardianId),
	})
);
