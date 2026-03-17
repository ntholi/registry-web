import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentFeedbackCategories } from '../../categories/_schema/studentFeedbackCategories';

export const studentFeedbackQuestions = pgTable('feedback_questions', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	categoryId: text()
		.references(() => studentFeedbackCategories.id, { onDelete: 'cascade' })
		.notNull(),
	text: text().notNull(),
	sortOrder: integer().notNull().default(0),
	createdAt: timestamp().defaultNow(),
});
