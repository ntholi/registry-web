import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feedbackCategories = pgTable('feedback_categories', {
	id: serial().primaryKey(),
	name: text().notNull(),
	createdAt: timestamp().defaultNow(),
});
