import { relations } from 'drizzle-orm';
import { feedbackResponses } from '../../_schema/feedbackResponses';
import { feedbackCategories } from '../../categories/_schema/feedbackCategories';
import { feedbackQuestions } from './feedbackQuestions';

export const feedbackQuestionsRelations = relations(
	feedbackQuestions,
	({ one, many }) => ({
		category: one(feedbackCategories, {
			fields: [feedbackQuestions.categoryId],
			references: [feedbackCategories.id],
		}),
		responses: many(feedbackResponses),
	})
);
