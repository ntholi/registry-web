import { relations } from 'drizzle-orm';
import { feedbackQuestions } from '../../questions/_schema/feedbackQuestions';
import { feedbackCategories } from './feedbackCategories';

export const feedbackCategoriesRelations = relations(
	feedbackCategories,
	({ many }) => ({
		questions: many(feedbackQuestions),
	})
);
