import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { feedbackCategories } from '../../categories/_schema/feedbackCategories';

export const feedbackQuestions = pgTable('feedback_questions', {
	id: serial().primaryKey(),
	categoryId: integer()
		.references(() => feedbackCategories.id, { onDelete: 'cascade' })
		.notNull(),
	text: text().notNull(),
	createdAt: timestamp().defaultNow(),
});
