import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { feedbackPassphrases } from '../cycles/_schema/feedbackPassphrases';
import { feedbackQuestions } from '../questions/_schema/feedbackQuestions';

export const feedbackResponses = pgTable(
	'feedback_responses',
	{
		id: serial().primaryKey(),
		passphraseId: integer()
			.references(() => feedbackPassphrases.id, { onDelete: 'cascade' })
			.notNull(),
		assignedModuleId: integer()
			.references(() => assignedModules.id, { onDelete: 'cascade' })
			.notNull(),
		questionId: integer()
			.references(() => feedbackQuestions.id)
			.notNull(),
		rating: integer().notNull(),
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
