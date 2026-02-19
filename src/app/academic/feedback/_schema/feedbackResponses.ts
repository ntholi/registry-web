import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { feedbackPassphrases } from '../cycles/_schema/feedbackPassphrases';
import { feedbackQuestions } from '../questions/_schema/feedbackQuestions';

export const feedbackResponses = pgTable(
	'feedback_responses',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		passphraseId: text()
			.references(() => feedbackPassphrases.id, { onDelete: 'cascade' })
			.notNull(),
		assignedModuleId: integer()
			.references(() => assignedModules.id, { onDelete: 'cascade' })
			.notNull(),
		questionId: text()
			.references(() => feedbackQuestions.id)
			.notNull(),
		rating: integer(),
		comment: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueResponse: unique().on(
			table.passphraseId,
			table.assignedModuleId,
			table.questionId
		),
	})
);
