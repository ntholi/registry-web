import { terms } from '@registry/terms/_schema/terms';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feedbackPeriods = pgTable('feedback_periods', {
	id: serial().primaryKey(),
	name: text().notNull(),
	termId: integer()
		.references(() => terms.id)
		.notNull(),
	startDate: text().notNull(),
	endDate: text().notNull(),
	createdAt: timestamp().defaultNow(),
});
