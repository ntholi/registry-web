import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const feedbackCategories = pgTable('feedback_categories', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	createdAt: timestamp().defaultNow(),
});
