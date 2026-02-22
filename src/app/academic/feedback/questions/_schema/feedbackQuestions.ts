import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { feedbackCategories } from '../../categories/_schema/feedbackCategories';

export const feedbackQuestions = pgTable('feedback_questions', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	categoryId: text()
		.references(() => feedbackCategories.id, { onDelete: 'cascade' })
		.notNull(),
	text: text().notNull(),
	sortOrder: integer().notNull().default(0),
	createdAt: timestamp().defaultNow(),
});
