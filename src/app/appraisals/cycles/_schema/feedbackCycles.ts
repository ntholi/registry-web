import { terms } from '@registry/terms/_schema/terms';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const feedbackCycles = pgTable('feedback_cycles', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	termId: integer()
		.references(() => terms.id)
		.notNull(),
	startDate: text().notNull(),
	endDate: text().notNull(),
	createdAt: timestamp().defaultNow(),
});
