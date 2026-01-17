import { date, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
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
