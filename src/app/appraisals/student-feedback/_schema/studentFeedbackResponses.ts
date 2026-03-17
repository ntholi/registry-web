import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentFeedbackPassphrases } from '../cycles/_schema/studentFeedbackPassphrases';
import { studentFeedbackQuestions } from '../questions/_schema/studentFeedbackQuestions';

export const studentFeedbackResponses = pgTable(
	'feedback_responses',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		passphraseId: text()
			.references(() => studentFeedbackPassphrases.id, { onDelete: 'cascade' })
			.notNull(),
		assignedModuleId: integer()
			.references(() => assignedModules.id, { onDelete: 'cascade' })
			.notNull(),
		questionId: text()
			.references(() => studentFeedbackQuestions.id)
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
