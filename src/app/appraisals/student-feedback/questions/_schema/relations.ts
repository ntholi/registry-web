import { relations } from 'drizzle-orm';
import { studentFeedbackResponses } from '../../_schema/studentFeedbackResponses';
import { studentFeedbackCategories } from '../../categories/_schema/studentFeedbackCategories';
import { studentFeedbackQuestions } from './studentFeedbackQuestions';

export const studentFeedbackQuestionsRelations = relations(
	studentFeedbackQuestions,
	({ one, many }) => ({
		category: one(studentFeedbackCategories, {
			fields: [studentFeedbackQuestions.categoryId],
			references: [studentFeedbackCategories.id],
		}),
		responses: many(studentFeedbackResponses),
	})
);
