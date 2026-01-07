import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { terms } from './terms';

export const graduationDates = pgTable('graduation_dates', {
	id: serial().primaryKey(),
	date: text().notNull(),
	termId: integer()
		.references(() => terms.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp().defaultNow(),
});
