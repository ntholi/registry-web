import { users } from '@auth/users/_schema/users';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const librarySettings = pgTable('library_settings', {
	id: serial().primaryKey(),
	studentLoanDuration: integer().notNull().default(14),
	staffLoanDuration: integer().notNull().default(30),
	createdAt: timestamp().defaultNow(),
	createdBy: text().references(() => users.id, { onDelete: 'set null' }),
	updatedAt: timestamp(),
	updatedBy: text().references(() => users.id, { onDelete: 'set null' }),
});
