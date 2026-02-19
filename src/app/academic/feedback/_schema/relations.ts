import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { relations } from 'drizzle-orm';
import { feedbackPassphrases } from '../cycles/_schema/feedbackPassphrases';
import { feedbackQuestions } from '../questions/_schema/feedbackQuestions';
import { feedbackResponses } from './feedbackResponses';

export const feedbackResponsesRelations = relations(
	feedbackResponses,
	({ one }) => ({
		passphrase: one(feedbackPassphrases, {
			fields: [feedbackResponses.passphraseId],
			references: [feedbackPassphrases.id],
		}),
		assignedModule: one(assignedModules, {
			fields: [feedbackResponses.assignedModuleId],
			references: [assignedModules.id],
		}),
		question: one(feedbackQuestions, {
			fields: [feedbackResponses.questionId],
			references: [feedbackQuestions.id],
		}),
	})
);
