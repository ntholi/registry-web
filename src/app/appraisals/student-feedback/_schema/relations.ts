import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { relations } from 'drizzle-orm';
import { studentFeedbackPassphrases } from '../cycles/_schema/studentFeedbackPassphrases';
import { studentFeedbackQuestions } from '../questions/_schema/studentFeedbackQuestions';
import { studentFeedbackResponses } from './studentFeedbackResponses';

export const studentFeedbackResponsesRelations = relations(
	studentFeedbackResponses,
	({ one }) => ({
		passphrase: one(studentFeedbackPassphrases, {
			fields: [studentFeedbackResponses.passphraseId],
			references: [studentFeedbackPassphrases.id],
		}),
		assignedModule: one(assignedModules, {
			fields: [studentFeedbackResponses.assignedModuleId],
			references: [assignedModules.id],
		}),
		question: one(studentFeedbackQuestions, {
			fields: [studentFeedbackResponses.questionId],
			references: [studentFeedbackQuestions.id],
		}),
	})
);
